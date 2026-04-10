import type { HttpClient } from '../http.js';
import type {
  AssignRoleBody,
  AssignRoleResponse,
  CreateRoleBody,
  ServerRoleObject,
  UpdateRoleBody,
} from '../types/server.js';

/**
 * Server roles. Roles are bitfield-based: combine `Permission.*` constants
 * with bitwise OR to build the `permissions` field. Default roles
 * (Owner, Admin, Member) cannot have their permissions edited; the API
 * returns 400 if you try.
 */
export class ServerRolesResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /servers/:id/roles - all roles in the server, sorted by `sortOrder`. */
  list(serverId: string): Promise<ServerRoleObject[]> {
    return this.http.request<ServerRoleObject[]>({
      method: 'GET',
      path: `/servers/${encodeURIComponent(serverId)}/roles`,
    });
  }

  /** POST /servers/:id/roles - create a new custom role. */
  create(serverId: string, body: CreateRoleBody): Promise<ServerRoleObject> {
    return this.http.request<ServerRoleObject>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(serverId)}/roles`,
      body,
    });
  }

  /** PATCH /servers/:id/roles/:roleId - update a custom role. */
  update(
    serverId: string,
    roleId: string,
    body: UpdateRoleBody,
  ): Promise<ServerRoleObject> {
    return this.http.request<ServerRoleObject>({
      method: 'PATCH',
      path: `/servers/${encodeURIComponent(serverId)}/roles/${encodeURIComponent(roleId)}`,
      body,
    });
  }

  /** DELETE /servers/:id/roles/:roleId - delete a custom role. */
  delete(serverId: string, roleId: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/servers/${encodeURIComponent(serverId)}/roles/${encodeURIComponent(roleId)}`,
    });
  }

  /** PUT /servers/:id/members/:userId/role - assign a role to a member. */
  assignToMember(
    serverId: string,
    userId: string,
    body: AssignRoleBody,
  ): Promise<AssignRoleResponse> {
    return this.http.request<AssignRoleResponse>({
      method: 'PUT',
      path: `/servers/${encodeURIComponent(serverId)}/members/${encodeURIComponent(userId)}/role`,
      body,
    });
  }
}
