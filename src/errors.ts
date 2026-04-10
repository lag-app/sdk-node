/**
 * Error envelope returned by the Lag API.
 *
 * Every API error response has the shape `{ error, message, statusCode }`.
 * The SDK parses these into a typed exception hierarchy so consumers can
 * `instanceof`-match the failure cases they care about.
 */
export interface LagApiErrorBody {
  error: string;
  message: string;
  statusCode: number;
}

/**
 * Base class for every error thrown by the Lag SDK.
 *
 * Subclasses correspond to specific HTTP status codes:
 *   - `LagAuthError`        - 401
 *   - `LagPermissionError`  - 403
 *   - `LagNotFoundError`    - 404
 *   - `LagConflictError`    - 409
 *   - `LagRateLimitError`   - 429
 *   - `LagServerError`      - 5xx
 *
 * Network failures (DNS, connection refused, timeouts before any status was
 * received) are wrapped in `LagConnectionError`.
 */
export class LagApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly body: LagApiErrorBody | null;
  public readonly requestId: string | null;

  constructor(
    message: string,
    status: number,
    code: string,
    body: LagApiErrorBody | null,
    requestId: string | null,
  ) {
    super(message);
    this.name = 'LagApiError';
    this.status = status;
    this.code = code;
    this.body = body;
    this.requestId = requestId;
  }
}

export class LagAuthError extends LagApiError {
  constructor(message: string, body: LagApiErrorBody | null, requestId: string | null) {
    super(message, 401, 'unauthorized', body, requestId);
    this.name = 'LagAuthError';
  }
}

export class LagPermissionError extends LagApiError {
  constructor(message: string, body: LagApiErrorBody | null, requestId: string | null) {
    super(message, 403, 'forbidden', body, requestId);
    this.name = 'LagPermissionError';
  }
}

export class LagNotFoundError extends LagApiError {
  constructor(message: string, body: LagApiErrorBody | null, requestId: string | null) {
    super(message, 404, 'not_found', body, requestId);
    this.name = 'LagNotFoundError';
  }
}

export class LagConflictError extends LagApiError {
  constructor(message: string, body: LagApiErrorBody | null, requestId: string | null) {
    super(message, 409, 'conflict', body, requestId);
    this.name = 'LagConflictError';
  }
}

export class LagRateLimitError extends LagApiError {
  /** Seconds the server asked the client to wait, parsed from `Retry-After`. */
  public readonly retryAfterSeconds: number | null;

  constructor(
    message: string,
    body: LagApiErrorBody | null,
    requestId: string | null,
    retryAfterSeconds: number | null,
  ) {
    super(message, 429, 'rate_limited', body, requestId);
    this.name = 'LagRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class LagServerError extends LagApiError {
  constructor(message: string, status: number, body: LagApiErrorBody | null, requestId: string | null) {
    super(message, status, 'server_error', body, requestId);
    this.name = 'LagServerError';
  }
}

/** Thrown when the request never reached the server (DNS, refused, timed out). */
export class LagConnectionError extends LagApiError {
  public override readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message, 0, 'connection_error', null, null);
    this.name = 'LagConnectionError';
    this.cause = cause;
  }
}

/**
 * Build the appropriate `LagApiError` subclass for an HTTP response.
 *
 * The Lag API always returns a JSON error envelope, but we still defend
 * against truncated or non-JSON bodies (e.g. an upstream proxy returning
 * plain text on 502).
 */
export function errorFromResponse(
  status: number,
  body: LagApiErrorBody | null,
  requestId: string | null,
  retryAfterSeconds: number | null,
): LagApiError {
  const message = body?.message || `HTTP ${status}`;
  switch (status) {
    case 401:
      return new LagAuthError(message, body, requestId);
    case 403:
      return new LagPermissionError(message, body, requestId);
    case 404:
      return new LagNotFoundError(message, body, requestId);
    case 409:
      return new LagConflictError(message, body, requestId);
    case 429:
      return new LagRateLimitError(message, body, requestId, retryAfterSeconds);
    default:
      if (status >= 500) return new LagServerError(message, status, body, requestId);
      return new LagApiError(message, status, body?.error ?? `http_${status}`, body, requestId);
  }
}
