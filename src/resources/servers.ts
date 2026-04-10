import type { HttpClient } from '../http.js';
import type {
  CreateServerBody,
  Server,
  ServerIconUploadBody,
  ServerIconUploadResponse,
  ServerWithDetails,
  UpdateServerBody,
} from '../types/server.js';
import { ServerInvitesResource } from './server-invites.js';
import { ServerMembersResource } from './server-members.js';
import { ServerRolesResource } from './server-roles.js';
import { RoomsResource } from './rooms.js';

/**
 * Servers resource. The top-level CRUD plus four nested sub-resources:
 *
 *   - `client.servers.invites` - create/list/revoke invites, join via code
 *   - `client.servers.members` - kick/ban/mute members, list bans/mutes
 *   - `client.servers.roles`   - role CRUD and assignment
 *   - `client.servers.rooms`   - voice rooms; `.messages` for chat in those rooms
 */
export class ServersResource {
  public readonly invites: ServerInvitesResource;
  public readonly members: ServerMembersResource;
  public readonly roles: ServerRolesResource;
  public readonly rooms: RoomsResource;

  constructor(private readonly http: HttpClient) {
    this.invites = new ServerInvitesResource(http);
    this.members = new ServerMembersResource(http);
    this.roles = new ServerRolesResource(http);
    this.rooms = new RoomsResource(http);
  }

  /** GET /servers/me - servers the caller is a member of. */
  list(): Promise<Server[]> {
    return this.http.request<Server[]>({ method: 'GET', path: '/servers/me' });
  }

  /** POST /servers - create a new server (capped at 1 owned per free user). */
  create(body: CreateServerBody): Promise<Server> {
    return this.http.request<Server>({ method: 'POST', path: '/servers', body });
  }

  /** GET /servers/:id - server detail with rooms, members, and the caller's role. */
  get(id: string): Promise<ServerWithDetails> {
    return this.http.request<ServerWithDetails>({
      method: 'GET',
      path: `/servers/${encodeURIComponent(id)}`,
    });
  }

  /** PATCH /servers/:id - update name, icon URL, or icon emoji. */
  update(id: string, body: UpdateServerBody): Promise<Server> {
    return this.http.request<Server>({
      method: 'PATCH',
      path: `/servers/${encodeURIComponent(id)}`,
      body,
    });
  }

  /** POST /servers/:id/icon - upload a base64-encoded server icon image. */
  uploadIcon(id: string, body: ServerIconUploadBody): Promise<ServerIconUploadResponse> {
    return this.http.request<ServerIconUploadResponse>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(id)}/icon`,
      body,
    });
  }

  /** DELETE /servers/:id - delete the server (owner only). */
  delete(id: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/servers/${encodeURIComponent(id)}`,
    });
  }

  /** DELETE /servers/:id/leave - leave a server (members only; owners cannot leave). */
  leave(id: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/servers/${encodeURIComponent(id)}/leave`,
    });
  }
}
