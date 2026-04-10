import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';

export interface RecordedRequest {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

export interface MockResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export type Handler = (req: RecordedRequest) => MockResponse | Promise<MockResponse>;

/**
 * A minimal in-process HTTP server that records requests and replies with
 * fixture responses. We use this instead of mocking `fetch` so the tests
 * exercise the real HTTP path: query encoding, body parsing, status mapping,
 * timeouts, and retry behavior all run end-to-end.
 *
 * Each test typically:
 *   1. `const mock = await startMockServer()`
 *   2. Sets a handler that returns the desired response.
 *   3. Constructs a `LagClient` pointed at `mock.baseUrl`.
 *   4. Asserts on `mock.requests` after the call.
 *   5. `await mock.close()`.
 */
export interface MockServer {
  baseUrl: string;
  requests: RecordedRequest[];
  setHandler(handler: Handler): void;
  /** Queue a sequence of responses; one is consumed per request. */
  enqueue(...responses: MockResponse[]): void;
  close(): Promise<void>;
}

export async function startMockServer(): Promise<MockServer> {
  const requests: RecordedRequest[] = [];
  const queue: MockResponse[] = [];
  let handler: Handler | null = null;

  const server: Server = createServer((req: IncomingMessage, res: ServerResponse) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      const recorded: RecordedRequest = {
        method: req.method ?? 'GET',
        path: req.url ?? '/',
        headers: req.headers,
        body,
      };
      requests.push(recorded);

      let response: MockResponse;
      try {
        if (handler) {
          response = await handler(recorded);
        } else if (queue.length > 0) {
          response = queue.shift()!;
        } else {
          response = { status: 500, body: { error: 'no handler', message: 'no handler', statusCode: 500 } };
        }
      } catch (err) {
        response = {
          status: 500,
          body: { error: 'handler-threw', message: String(err), statusCode: 500 },
        };
      }

      const status = response.status ?? 200;
      const headers = response.headers ?? {};
      const responseBody = response.body;

      let payload: string;
      if (responseBody === undefined || responseBody === null) {
        payload = '';
      } else if (typeof responseBody === 'string') {
        payload = responseBody;
      } else {
        payload = JSON.stringify(responseBody);
        if (!headers['content-type'] && !headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      res.writeHead(status, headers);
      res.end(payload);
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    requests,
    setHandler(h: Handler) {
      handler = h;
    },
    enqueue(...responses: MockResponse[]) {
      queue.push(...responses);
    },
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
