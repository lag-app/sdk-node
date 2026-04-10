/**
 * Unified identity returned by both user PAT and robot key callers.
 *
 * The Lag API exposes two ways to authenticate: a user Personal Access
 * Token (`lag_pat_*`) backed by `GET /users/me`, and a robot API key
 * (`lag_robot_*`) backed by `GET /robots/@me/info`. The two endpoints
 * return different shapes, but most callers just want "who am I, what is
 * my display name, what is my avatar". `Identity` is that unified view.
 *
 * Use `LagClient.identity()` to fetch it. Inspect `kind` if you need to
 * branch on user-vs-robot specific fields.
 */
export type IdentityKind = 'user' | 'robot';

export interface Identity {
  /** Stable ID of the user or robot. */
  id: string;
  /** Discriminator: `'user'` for PAT callers, `'robot'` for robot keys. */
  kind: IdentityKind;
  /**
   * The user's display name (or username if unset) for users, or the
   * robot's name for robots. Always populated.
   */
  displayName: string;
  /** Avatar URL, if any. */
  avatarUrl: string | null;
  /** ISO timestamp when the user or robot was created. */
  createdAt: string | null;
  /** Username. Only populated for users. */
  username: string | null;
  /** Server the robot belongs to. Only populated for robots. */
  serverId: string | null;
  /** Granted permissions. Only populated for robots. */
  permissions: string[] | null;
  /** Whether the robot is enabled. Only populated for robots. */
  active: boolean | null;
}
