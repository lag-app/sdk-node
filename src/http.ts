import {
  errorFromResponse,
  LagApiError,
  LagConnectionError,
  LagRateLimitError,
  type LagApiErrorBody,
} from './errors.js';
import { USER_AGENT } from './version.js';

export interface LagClientOptions {
  /**
   * Credential for the API. Either a user Personal Access Token
   * (`lag_pat_*`) or a robot API key (`lag_robot_*`). The SDK detects the
   * prefix and switches the Authorization scheme to `Bearer` or `Robot`
   * automatically.
   */
  token: string;
  /** API base URL. Defaults to `https://api.trylag.com`. */
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Defaults to 30000 (30s). */
  timeoutMs?: number;
  /** Maximum retry attempts for transient failures. Defaults to 2. */
  maxRetries?: number;
  /** Override the User-Agent string. */
  userAgent?: string;
  /** Custom fetch implementation (defaults to global fetch). */
  fetch?: typeof fetch;
}

const ROBOT_TOKEN_PREFIX = 'lag_robot_';
const ROBOT_PATH_PREFIX = '/robots/@me';

function detectAuthMode(token: string): { scheme: 'Bearer' | 'Robot'; isRobot: boolean } {
  if (token.startsWith(ROBOT_TOKEN_PREFIX)) {
    return { scheme: 'Robot', isRobot: true };
  }
  return { scheme: 'Bearer', isRobot: false };
}

/**
 * Rewrite a user-style path to its `/robots/@me` equivalent.
 *
 * Robot keys are scoped to a single server and only have endpoints under
 * `/robots/@me`. The robot routes mirror the user routes for the
 * operations a robot can perform (sending, editing, deleting messages,
 * listing rooms / members / message history), so prepending the prefix is
 * enough to make existing resource methods work transparently.
 *
 * Paths that have no robot equivalent are passed through unchanged and
 * will return 401/403/404/405 from the API.
 */
function rewriteRobotPath(path: string): string {
  if (path.startsWith(ROBOT_PATH_PREFIX)) return path;
  if (path === '/servers' || path.startsWith('/servers/')) {
    return ROBOT_PATH_PREFIX + path;
  }
  return path;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  /** When true, body is sent raw (multipart) instead of JSON-encoded. */
  rawBody?: BodyInit;
  /** Extra headers merged onto the default set. */
  headers?: Record<string, string>;
  /** Override the client default timeout. */
  timeoutMs?: number;
  /** Override the client default retry count. */
  maxRetries?: number;
}

const DEFAULT_BASE_URL = 'https://api.trylag.com';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;

/**
 * Low-level HTTP transport shared by every resource.
 *
 * Responsibilities:
 *   - Inject Authorization, User-Agent, Accept headers.
 *   - Build query strings, JSON-encode bodies, parse JSON responses.
 *   - Map non-2xx responses to typed errors.
 *   - Retry transient failures (5xx, 429, network) with exponential backoff.
 *   - Honor the server's `Retry-After` header on 429.
 *   - Enforce per-request timeouts via AbortController.
 */
export class HttpClient {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;
  private readonly authScheme: 'Bearer' | 'Robot';
  /** True when the configured token is a robot API key (`lag_robot_*`). */
  public readonly isRobot: boolean;

  constructor(opts: LagClientOptions) {
    if (!opts.token || typeof opts.token !== 'string') {
      throw new TypeError('LagClient: `token` is required');
    }
    this.token = opts.token;
    const { scheme, isRobot } = detectAuthMode(opts.token);
    this.authScheme = scheme;
    this.isRobot = isRobot;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.userAgent = opts.userAgent ?? USER_AGENT;
    this.fetchImpl = opts.fetch ?? globalThis.fetch;
    if (!this.fetchImpl) {
      throw new Error('LagClient: global fetch not available; pass `fetch` in options');
    }
  }

  async request<T>(opts: RequestOptions): Promise<T> {
    const url = this.buildUrl(opts.path, opts.query);
    const headers = this.buildHeaders(opts);
    const body = this.buildBody(opts);
    const maxRetries = opts.maxRetries ?? this.maxRetries;
    const timeoutMs = opts.timeoutMs ?? this.timeoutMs;

    let attempt = 0;
    // The retry loop. We retry on 5xx, 429, and connection errors. We never
    // retry 4xx (except 429), since the request is invalid as-is.
    for (;;) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          method: opts.method,
          headers,
          body,
          signal: controller.signal,
        });
      } catch (err) {
        clearTimeout(timer);
        if (attempt < maxRetries) {
          attempt += 1;
          await sleep(backoffDelay(attempt));
          continue;
        }
        throw new LagConnectionError(
          err instanceof Error ? err.message : 'Network request failed',
          err,
        );
      }
      clearTimeout(timer);

      if (response.ok) {
        return (await this.decodeBody(response)) as T;
      }

      const requestId = response.headers.get('x-request-id');
      const errorBody = await this.parseErrorBody(response);
      const retryAfter = parseRetryAfter(response.headers.get('retry-after'));
      const error = errorFromResponse(response.status, errorBody, requestId, retryAfter);

      const retryable =
        (response.status >= 500 && response.status < 600) || response.status === 429;
      if (retryable && attempt < maxRetries) {
        attempt += 1;
        const wait =
          error instanceof LagRateLimitError && error.retryAfterSeconds != null
            ? error.retryAfterSeconds * 1000
            : backoffDelay(attempt);
        await sleep(wait);
        continue;
      }
      throw error;
    }
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | null | undefined>,
  ): string {
    let normalized = path.startsWith('/') ? path : `/${path}`;
    if (this.isRobot) {
      normalized = rewriteRobotPath(normalized);
    }
    const url = new URL(this.baseUrl + normalized);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private buildHeaders(opts: RequestOptions): Headers {
    const headers = new Headers({
      Authorization: `${this.authScheme} ${this.token}`,
      Accept: 'application/json',
      'User-Agent': this.userAgent,
    });
    if (opts.body !== undefined && !opts.rawBody) {
      headers.set('Content-Type', 'application/json');
    }
    if (opts.headers) {
      for (const [k, v] of Object.entries(opts.headers)) headers.set(k, v);
    }
    return headers;
  }

  private buildBody(opts: RequestOptions): BodyInit | undefined {
    if (opts.rawBody !== undefined) return opts.rawBody;
    if (opts.body === undefined) return undefined;
    return JSON.stringify(opts.body);
  }

  private async decodeBody(response: Response): Promise<unknown> {
    if (response.status === 204) return undefined;
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      return text.length === 0 ? undefined : text;
    }
    const text = await response.text();
    if (text.length === 0) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private async parseErrorBody(response: Response): Promise<LagApiErrorBody | null> {
    try {
      const text = await response.text();
      if (!text) return null;
      const parsed = JSON.parse(text) as Partial<LagApiErrorBody> & Record<string, unknown>;
      if (typeof parsed === 'object' && parsed !== null && typeof parsed.message === 'string') {
        return {
          error: typeof parsed.error === 'string' ? parsed.error : `HTTP ${response.status}`,
          message: parsed.message,
          statusCode:
            typeof parsed.statusCode === 'number' ? parsed.statusCode : response.status,
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}

/** Exponential backoff with jitter. Capped at ~8s. */
function backoffDelay(attempt: number): number {
  const base = Math.min(8000, 250 * 2 ** (attempt - 1));
  const jitter = Math.random() * 250;
  return base + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds;
  // HTTP-date form. Parse and convert to seconds-from-now.
  const date = Date.parse(value);
  if (Number.isFinite(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }
  return null;
}

/**
 * Re-export so consumers can `instanceof`-check transport-layer errors
 * without importing from a deeper path.
 */
export { LagApiError };
