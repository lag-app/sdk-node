import type { UserStatus } from './common.js';

export interface UserFlags {
  hasAccess?: boolean;
  suspended?: boolean;
  suspendedAt?: string;
  suspendedReason?: string;
  features?: Record<string, boolean>;
}

export interface User {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  steamId?: string | null;
  createdAt: string;
  flags?: UserFlags;
}

export interface UpdateUserBody {
  displayName?: string;
  avatarUrl?: string;
  steamId?: string | null;
}

export interface SetupUserBody {
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface AvatarUploadBody {
  /** Base64-encoded image bytes (no data URL prefix). */
  image: string;
  /** MIME type, e.g. "image/png". Defaults server-side to "image/jpeg". */
  contentType?: string;
}

export interface AvatarUploadResponse {
  avatarUrl: string;
}

export interface PushTokenBody {
  token: string;
  platform: 'ios' | 'android';
}

export interface CheckUsernameResponse {
  available: boolean;
}

export interface SteamLookupResponse {
  steamId: string;
  personaName: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
  gameName: string | null;
}

export interface SteamActivityResponse {
  gameName: string | null;
}

export interface UserConfig {
  features: Record<string, { enabled: boolean; beta?: boolean }>;
}
