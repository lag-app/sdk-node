import type { HttpClient } from '../http.js';
import { paginate, type CursorParams, type Page } from '../pagination.js';
import type {
  DmConversation,
  DmMessage,
  EditDmMessageBody,
  SendDmMessageBody,
} from '../types/dm.js';
import type { PaginatedResponse } from '../pagination.js';

/**
 * Direct messages resource.
 *
 * Conversations are auto-created the first time you `create({ userId })` for
 * a friend. The other side must be in your friends list (with status
 * `accepted`); the API returns 403 otherwise. Messages are paginated by an
 * ISO timestamp cursor (older-than).
 */
export class DmsResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /dms - list all DM conversations the caller participates in. */
  list(): Promise<DmConversation[]> {
    return this.http.request<DmConversation[]>({ method: 'GET', path: '/dms' });
  }

  /** POST /dms - create or fetch the conversation with another user. */
  create(userId: string): Promise<DmConversation> {
    return this.http.request<DmConversation>({
      method: 'POST',
      path: '/dms',
      body: { userId },
    });
  }

  /** GET /dms/:id - fetch a single conversation by its ID. */
  get(conversationId: string): Promise<DmConversation> {
    return this.http.request<DmConversation>({
      method: 'GET',
      path: `/dms/${encodeURIComponent(conversationId)}`,
    });
  }

  /** GET /dms/:id/messages - one page of messages, oldest-first within the page. */
  listMessages(
    conversationId: string,
    params: CursorParams = {},
  ): Promise<PaginatedResponse<DmMessage>> {
    return this.http.request<PaginatedResponse<DmMessage>>({
      method: 'GET',
      path: `/dms/${encodeURIComponent(conversationId)}/messages`,
      query: { limit: params.limit, cursor: params.cursor },
    });
  }

  /**
   * Async-iterate every page of messages, walking the cursor automatically.
   *
   *     for await (const page of client.dms.iterMessages(convId)) {
   *       for (const m of page.items) console.log(m.content);
   *     }
   */
  iterMessages(
    conversationId: string,
    params: CursorParams = {},
  ): AsyncGenerator<Page<DmMessage>, void, void> {
    return paginate<DmMessage>(
      this.http,
      `/dms/${encodeURIComponent(conversationId)}/messages`,
      params,
      'messages',
    );
  }

  /** POST /dms/:id/messages - send a message (text and/or image). */
  sendMessage(conversationId: string, body: SendDmMessageBody): Promise<DmMessage> {
    return this.http.request<DmMessage>({
      method: 'POST',
      path: `/dms/${encodeURIComponent(conversationId)}/messages`,
      body,
    });
  }

  /** PATCH /dms/:id/messages/:messageId - edit a message you authored. */
  editMessage(
    conversationId: string,
    messageId: string,
    body: EditDmMessageBody,
  ): Promise<DmMessage> {
    return this.http.request<DmMessage>({
      method: 'PATCH',
      path: `/dms/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
      body,
    });
  }

  /** DELETE /dms/:id/messages/:messageId - delete a message you authored. */
  deleteMessage(conversationId: string, messageId: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/dms/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
    });
  }
}
