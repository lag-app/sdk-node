import type { HttpClient } from '../http.js';
import type {
  BanMemberBody,
  MuteMemberBody,
  ServerBan,
  ServerMute,
} from '../types/server.js';

/**
 * Server member moderation. The "list members" call lives on
 * `client.servers.get(id)` since the API returns members inline with the
 * server detail; this resource focuses on kick / ban / mute actions and the
 * paginated lists of active bans / mutes.
 */
export class ServerMembersResource {
  constructor(private readonly http: HttpClient) {}

  /** DELETE /servers/:id/members/:userId - kick a member (admin/owner only). */
  kick(serverId: string, userId: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/servers/${encodeURIComponent(serverId)}/members/${encodeURIComponent(userId)}`,
    });
  }

  /** GET /servers/:id/bans - list currently active bans. */
  listBans(serverId: string): Promise<ServerBan[]> {
    return this.http.request<ServerBan[]>({
      method: 'GET',
      path: `/servers/${encodeURIComponent(serverId)}/bans`,
    });
  }

  /** POST /servers/:id/bans/:userId - ban a member (optionally with a reason and duration in minutes). */
  ban(serverId: string, userId: string, body: BanMemberBody = {}): Promise<ServerBan> {
    return this.http.request<ServerBan>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(serverId)}/bans/${encodeURIComponent(userId)}`,
      body,
    });
  }

  /** DELETE /servers/:id/bans/:userId - lift an existing ban. */
  unban(serverId: string, userId: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/servers/${encodeURIComponent(serverId)}/bans/${encodeURIComponent(userId)}`,
    });
  }

  /** GET /servers/:id/mutes - list currently active mutes. */
  listMutes(serverId: string): Promise<ServerMute[]> {
    return this.http.request<ServerMute[]>({
      method: 'GET',
      path: `/servers/${encodeURIComponent(serverId)}/mutes`,
    });
  }

  /** POST /servers/:id/mutes/:userId - mute a member (optionally with a reason and duration in minutes). */
  mute(serverId: string, userId: string, body: MuteMemberBody = {}): Promise<ServerMute> {
    return this.http.request<ServerMute>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(serverId)}/mutes/${encodeURIComponent(userId)}`,
      body,
    });
  }

  /** DELETE /servers/:id/mutes/:userId - lift an existing mute. */
  unmute(serverId: string, userId: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/servers/${encodeURIComponent(serverId)}/mutes/${encodeURIComponent(userId)}`,
    });
  }
}
