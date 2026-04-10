export { LagClient } from './client.js';
export type { LagClientOptions, RequestOptions } from './http.js';

export {
  LagApiError,
  LagAuthError,
  LagPermissionError,
  LagNotFoundError,
  LagConflictError,
  LagRateLimitError,
  LagServerError,
  LagConnectionError,
  LagInvalidTokenError,
} from './errors.js';
export type { LagApiErrorBody } from './errors.js';

export { paginate } from './pagination.js';
export type { CursorParams, Page, PaginatedResponse } from './pagination.js';

export { SDK_VERSION, USER_AGENT } from './version.js';

// Resources are not constructed directly by users, but exporting them lets
// people who want strict typing for handlers (e.g. dependency injection) get
// at the resource classes themselves.
export { SystemResource } from './resources/system.js';
export { UsersResource } from './resources/users.js';
export { FriendsResource } from './resources/friends.js';
export { DmsResource } from './resources/dms.js';
export { ServersResource } from './resources/servers.js';
export { ServerInvitesResource } from './resources/server-invites.js';
export { ServerMembersResource } from './resources/server-members.js';
export { ServerRolesResource } from './resources/server-roles.js';
export { RoomsResource } from './resources/rooms.js';
export { RoomMessagesResource } from './resources/room-messages.js';
export { EventsResource } from './resources/events.js';
export { EventGuestsResource } from './resources/event-guests.js';
export { EventTemplatesResource } from './resources/event-templates.js';
export { ImagesResource, type ImageInput, type UploadImageOptions } from './resources/images.js';

// All the data types from the API surface.
export * from './types/index.js';
