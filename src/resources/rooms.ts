import type { HttpClient } from '../http.js';
import type { CreateRoomBody, Room, UpdateRoomBody } from '../types/room.js';
import { RoomMessagesResource } from './room-messages.js';

/**
 * Voice rooms (channels) within a server.
 *
 * Hung off `client.servers.rooms`. The companion `messages` sub-resource
 * gives full access to per-room chat (`client.servers.rooms.messages.send(...)`).
 *
 * Rooms are created/managed via the parent `/servers/:id/rooms*` paths; only
 * server admins/owners can create, rename, or delete them.
 */
export class RoomsResource {
  public readonly messages: RoomMessagesResource;

  constructor(private readonly http: HttpClient) {
    this.messages = new RoomMessagesResource(http);
  }

  /** POST /servers/:id/rooms - create a new voice room. */
  create(serverId: string, body: CreateRoomBody): Promise<Room> {
    return this.http.request<Room>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(serverId)}/rooms`,
      body,
    });
  }

  /** PATCH /servers/:id/rooms/:roomId - rename or change capacity. */
  update(serverId: string, roomId: string, body: UpdateRoomBody): Promise<Room> {
    return this.http.request<Room>({
      method: 'PATCH',
      path: `/servers/${encodeURIComponent(serverId)}/rooms/${encodeURIComponent(roomId)}`,
      body,
    });
  }

  /** DELETE /servers/:id/rooms/:roomId - delete a voice room. */
  delete(serverId: string, roomId: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/servers/${encodeURIComponent(serverId)}/rooms/${encodeURIComponent(roomId)}`,
    });
  }
}
