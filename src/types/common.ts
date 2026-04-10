/**
 * User presence status. The string `in-game` is hyphenated server-side; the
 * SDK preserves it verbatim instead of normalizing to camelCase.
 */
export type UserStatus = 'online' | 'offline' | 'in-game' | 'idle';

/**
 * Server permission bitflags. These are the same numeric values used by the
 * Lag API and stored on `serverRoles.permissions`. Permissions compose with
 * bitwise OR.
 */
export const Permission = {
  MANAGE_SERVER: 1 << 0,
  MANAGE_ROLES: 1 << 1,
  MANAGE_ROOMS: 1 << 2,
  MANAGE_MESSAGES: 1 << 3,
  MANAGE_MEMBERS: 1 << 4,
  KICK_MEMBERS: 1 << 5,
  BAN_MEMBERS: 1 << 6,
  MUTE_MEMBERS: 1 << 7,
  MANAGE_EVENTS: 1 << 8,
  MENTION_EVERYONE: 1 << 9,
  CREATE_INVITES: 1 << 10,
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

/** Test whether a permission bitfield grants a specific permission. */
export function hasPermission(perms: number, perm: number): boolean {
  return (perms & perm) === perm;
}
