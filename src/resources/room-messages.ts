import type { HttpClient } from '../http.js';
import {
  paginate,
  type CursorParams,
  type Page,
  type PaginatedResponse,
} from '../pagination.js';
import type {
  EditRoomMessageBody,
  RoomMessage,
  SendRoomMessageBody,
} from '../types/room.js';

/**
 * Room messages sub-resource. Walked off `client.servers.rooms.messages`.
 *
 * Pagination is identical to DM messages: ISO timestamp cursor, fetches
 * older-than-cursor, max page size 100.
 */
export class RoomMessagesResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /servers/:serverId/rooms/:roomId/messages - one page. */
  list(
    serverId: string,
    roomId: string,
    params: CursorParams = {},
  ): Promise<PaginatedResponse<RoomMessage>> {
    return this.http.request<PaginatedResponse<RoomMessage>>({
      method: 'GET',
      path: `/servers/${encodeURIComponent(serverId)}/rooms/${encodeURIComponent(roomId)}/messages`,
      query: { limit: params.limit, cursor: params.cursor },
    });
  }

  /** Iterate every page of room messages with the cursor walked automatically. */
  iter(
    serverId: string,
    roomId: string,
    params: CursorParams = {},
  ): AsyncGenerator<Page<RoomMessage>, void, void> {
    return paginate<RoomMessage>(
      this.http,
      `/servers/${encodeURIComponent(serverId)}/rooms/${encodeURIComponent(roomId)}/messages`,
      params,
      'messages',
    );
  }

  /** POST /servers/:serverId/rooms/:roomId/messages - send a message. */
  send(
    serverId: string,
    roomId: string,
    body: SendRoomMessageBody,
  ): Promise<RoomMessage> {
    return this.http.request<RoomMessage>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(serverId)}/rooms/${encodeURIComponent(roomId)}/messages`,
      body,
    });
  }

  /** PATCH /servers/:serverId/rooms/:roomId/messages/:messageId - edit your message. */
  edit(
    serverId: string,
    roomId: string,
    messageId: string,
    body: EditRoomMessageBody,
  ): Promise<RoomMessage> {
    return this.http.request<RoomMessage>({
      method: 'PATCH',
      path: `/servers/${encodeURIComponent(serverId)}/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}`,
      body,
    });
  }

  /** DELETE /servers/:serverId/rooms/:roomId/messages/:messageId - delete a message. */
  delete(serverId: string, roomId: string, messageId: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/servers/${encodeURIComponent(serverId)}/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}`,
    });
  }
}
