import type { HttpClient } from '../http.js';
import type {
  AvatarUploadBody,
  AvatarUploadResponse,
  CheckUsernameResponse,
  PushTokenBody,
  SetupUserBody,
  SteamActivityResponse,
  SteamLookupResponse,
  UpdateUserBody,
  User,
} from '../types/user.js';

/**
 * Users resource. Covers the calling user's own profile (`/users/me/*`) and
 * lookups for other users (`/users/:id`, `/users/search`, `/users/check-username`).
 *
 * Setup-related endpoints (`/users/me/setup`) and Steam integration are also
 * exposed since they belong to the public user-facing surface, but they will
 * only succeed for callers using a Supabase JWT (PATs are issued *after*
 * setup is complete).
 */
export class UsersResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /users/me - the currently authenticated user. */
  me(): Promise<User> {
    return this.http.request<User>({ method: 'GET', path: '/users/me' });
  }

  /** PATCH /users/me - update display name, avatar URL, or Steam ID. */
  updateMe(body: UpdateUserBody): Promise<User> {
    return this.http.request<User>({ method: 'PATCH', path: '/users/me', body });
  }

  /** POST /users/me/setup - one-time account setup (username + display name). */
  setup(body: SetupUserBody): Promise<User> {
    return this.http.request<User>({ method: 'POST', path: '/users/me/setup', body });
  }

  /** POST /users/me/avatar - upload a profile avatar (base64 image). */
  uploadAvatar(body: AvatarUploadBody): Promise<AvatarUploadResponse> {
    return this.http.request<AvatarUploadResponse>({
      method: 'POST',
      path: '/users/me/avatar',
      body,
    });
  }

  /** POST /users/me/push-token - register a mobile push notification token. */
  registerPushToken(body: PushTokenBody): Promise<{ ok: true }> {
    return this.http.request<{ ok: true }>({
      method: 'POST',
      path: '/users/me/push-token',
      body,
    });
  }

  /** DELETE /users/me/push-token - drop a previously registered push token. */
  removePushToken(token: string): Promise<{ ok: true }> {
    return this.http.request<{ ok: true }>({
      method: 'DELETE',
      path: '/users/me/push-token',
      body: { token },
    });
  }

  /** POST /users/me/request-deletion - schedule account deletion (7-day grace period). */
  requestDeletion(): Promise<User> {
    return this.http.request<User>({ method: 'POST', path: '/users/me/request-deletion' });
  }

  /** POST /users/me/cancel-deletion - cancel a pending account deletion. */
  cancelDeletion(): Promise<User> {
    return this.http.request<User>({ method: 'POST', path: '/users/me/cancel-deletion' });
  }

  /** GET /users/me/steam-lookup?q=... - resolve a Steam profile by ID, vanity name, or URL. */
  steamLookup(query: string): Promise<SteamLookupResponse> {
    return this.http.request<SteamLookupResponse>({
      method: 'GET',
      path: '/users/me/steam-lookup',
      query: { q: query },
    });
  }

  /** POST /users/me/steam-avatar - import a Steam avatar to the Lag profile. */
  importSteamAvatar(avatarUrl: string): Promise<AvatarUploadResponse> {
    return this.http.request<AvatarUploadResponse>({
      method: 'POST',
      path: '/users/me/steam-avatar',
      body: { avatarUrl },
    });
  }

  /** GET /users/me/steam-activity - current game name from Steam, if linked. */
  steamActivity(): Promise<SteamActivityResponse> {
    return this.http.request<SteamActivityResponse>({
      method: 'GET',
      path: '/users/me/steam-activity',
    });
  }

  /** GET /users/check-username?username=... - check whether a username is available. */
  checkUsername(username: string): Promise<CheckUsernameResponse> {
    return this.http.request<CheckUsernameResponse>({
      method: 'GET',
      path: '/users/check-username',
      query: { username },
    });
  }

  /** GET /users/search?q=... - search users by username (max 20 results). */
  search(query: string): Promise<User[]> {
    return this.http.request<User[]>({
      method: 'GET',
      path: '/users/search',
      query: { q: query },
    });
  }

  /** GET /users/:id - fetch a user by ID. */
  get(id: string): Promise<User> {
    return this.http.request<User>({ method: 'GET', path: `/users/${encodeURIComponent(id)}` });
  }
}
