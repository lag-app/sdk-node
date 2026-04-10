import type { HttpClient } from './http.js';

/**
 * Standard cursor-paginated response from the Lag API.
 *
 * Lag uses a single shape across DM and room message endpoints:
 * `{ messages, hasMore, nextCursor }`. The cursor is an ISO timestamp the
 * server uses with `lt(createdAt)` to fetch the next page (older messages).
 */
export interface PaginatedResponse<T> {
  messages: T[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface CursorParams {
  /** Page size. Server caps at 100. Defaults to 50 if omitted. */
  limit?: number;
  /** Opaque cursor returned from the previous page's `nextCursor`. */
  cursor?: string;
}

/**
 * An async-iterable page walker for cursor-paginated endpoints.
 *
 * Usage:
 *   ```ts
 *   for await (const page of client.dms.iterMessages(convId)) {
 *     for (const msg of page.items) console.log(msg.content);
 *   }
 *   ```
 *
 * Each yielded page also includes the underlying `nextCursor`, so callers can
 * stop iterating early without losing their place.
 */
export interface Page<T> {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
}

export async function* paginate<T>(
  http: HttpClient,
  path: string,
  initialParams: CursorParams,
  // The "items" field name varies (e.g. "messages", "events"). Pass a getter.
  itemsKey: string,
): AsyncGenerator<Page<T>, void, void> {
  let cursor: string | undefined = initialParams.cursor;
  const limit = initialParams.limit;

  for (;;) {
    const query: Record<string, string | number | undefined> = {};
    if (limit !== undefined) query.limit = limit;
    if (cursor !== undefined) query.cursor = cursor;

    const response = await http.request<Record<string, unknown>>({
      method: 'GET',
      path,
      query,
    });

    const items = (response[itemsKey] as T[]) ?? [];
    const hasMore = response.hasMore === true;
    const nextCursor = (response.nextCursor as string | null) ?? null;

    yield { items, hasMore, nextCursor };

    if (!hasMore || !nextCursor) return;
    cursor = nextCursor;
  }
}
