import type { HttpClient } from '../http.js';
import type {
  CreateInviteBody,
  Server,
  ServerInvite,
  ServerInvitePreview,
} from '../types/server.js';

/**
 * Server invites sub-resource. Hung off `client.servers.invites` for
 * discoverability. Most methods scope to a single server, except `preview`
 * and `join` which operate purely on an invite code.
 */
export class ServerInvitesResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /servers/:id/invites - list active invites for a server (admin/owner). */
  list(serverId: string): Promise<ServerInvite[]> {
    return this.http.request<ServerInvite[]>({
      method: 'GET',
      path: `/servers/${encodeURIComponent(serverId)}/invites`,
    });
  }

  /** POST /servers/:id/invites - generate a new invite code. */
  create(serverId: string, body: CreateInviteBody = {}): Promise<ServerInvite> {
    return this.http.request<ServerInvite>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(serverId)}/invites`,
      body,
    });
  }

  /** DELETE /servers/:id/invites/:inviteId - revoke an invite. */
  revoke(serverId: string, inviteId: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/servers/${encodeURIComponent(serverId)}/invites/${encodeURIComponent(inviteId)}`,
    });
  }

  /**
   * GET /servers/invite/:code - public preview of an invite (no auth needed
   * server-side, but the SDK still sends the bearer token, which is fine).
   */
  preview(code: string): Promise<ServerInvitePreview> {
    return this.http.request<ServerInvitePreview>({
      method: 'GET',
      path: `/servers/invite/${encodeURIComponent(code)}`,
    });
  }

  /** POST /servers/join/:code - join a server via an invite code. */
  join(code: string): Promise<Server> {
    return this.http.request<Server>({
      method: 'POST',
      path: `/servers/join/${encodeURIComponent(code)}`,
    });
  }

  /** POST /servers/:id/invite-friend - directly invite a single friend (no code). */
  inviteFriend(serverId: string, userId: string): Promise<{ sent: boolean }> {
    return this.http.request<{ sent: boolean }>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(serverId)}/invite-friend`,
      body: { userId },
    });
  }
}
