import type { UserStatus } from './common.js';
import type { Room } from './room.js';

export type ServerRole = 'owner' | 'admin' | 'member';

export interface Server {
  id: string;
  name: string;
  iconUrl: string | null;
  iconEmoji: string | null;
  ownerId: string;
  memberCount: number;
  createdAt: string;
}

export interface ServerWithDetails extends Server {
  rooms: Room[];
  members: ServerMember[];
  myRole: ServerRole;
}

export interface ServerMember {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: ServerRole;
  roleId: string | null;
  status: UserStatus;
  joinedAt: string;
}

export interface ServerRoleObject {
  id: string;
  serverId: string;
  name: string;
  color: string | null;
  permissions: number;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
}

export interface ServerInvite {
  id: string;
  code: string;
  createdBy: string;
  maxUses: number | null;
  uses: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface ServerInvitePreview {
  serverName: string;
  serverIconUrl: string | null;
  serverIconEmoji: string | null;
  memberCount: number;
  memberLimit: number;
  isFull: boolean;
  valid: boolean;
}

export interface ServerBan {
  id: string;
  serverId: string;
  userId: string;
  bannedBy: string | null;
  reason: string | null;
  expiresAt: string | null;
  createdAt: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ServerMute {
  id: string;
  serverId: string;
  userId: string;
  mutedBy: string | null;
  reason: string | null;
  expiresAt: string | null;
  createdAt: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface CreateServerBody {
  name: string;
  iconEmoji?: string | null;
}

export interface UpdateServerBody {
  name?: string;
  iconUrl?: string | null;
  iconEmoji?: string | null;
}

export interface ServerIconUploadBody {
  /** Base64-encoded image bytes (no data URL prefix). */
  image: string;
  contentType?: string;
}

export interface ServerIconUploadResponse {
  iconUrl: string;
}

export interface CreateInviteBody {
  maxUses?: number;
  expiresInHours?: number;
}

export interface InviteFriendBody {
  userId: string;
}

export interface BanMemberBody {
  reason?: string;
  /** Duration in minutes. Omit for a permanent ban. */
  duration?: number;
}

export interface MuteMemberBody {
  reason?: string;
  /** Duration in minutes. Omit for an indefinite mute. */
  duration?: number;
}

export interface CreateRoleBody {
  name: string;
  color?: string;
  permissions: number;
}

export interface UpdateRoleBody {
  name?: string;
  color?: string;
  permissions?: number;
  sortOrder?: number;
}

export interface AssignRoleBody {
  roleId: string;
}

export interface AssignRoleResponse {
  userId: string;
  roleId: string;
  roleName: string;
  role: ServerRole;
}
