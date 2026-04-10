import { HttpClient, type LagClientOptions } from './http.js';
import { SystemResource } from './resources/system.js';
import { UsersResource } from './resources/users.js';
import { FriendsResource } from './resources/friends.js';
import { DmsResource } from './resources/dms.js';
import { ServersResource } from './resources/servers.js';
import { EventsResource } from './resources/events.js';
import { ImagesResource } from './resources/images.js';
import type { Identity } from './types/identity.js';
import type { User } from './types/user.js';

interface RobotInfo {
  id: string;
  name: string;
  serverId: string;
  avatarUrl: string | null;
  permissions: string[];
  active: boolean;
  createdAt: string;
}

/**
 * The Lag SDK entry point.
 *
 * Construct it with a credential, either a user Personal Access Token
 * (`lag_pat_*`) or a robot API key (`lag_robot_*`):
 *
 *   ```ts
 *   import { LagClient } from '@lagapp/sdk';
 *
 *   const client = new LagClient({ token: process.env.LAG_TOKEN! });
 *   const who = await client.identity();
 *   console.log(who.displayName);
 *   ```
 *
 * Robot keys use the same `token` parameter; the SDK detects the prefix
 * and switches the Authorization scheme automatically. Server-scoped
 * actions (sending, editing, deleting messages, listing rooms / members /
 * message history) work transparently against the robot endpoints, so a
 * bot can use the same `client.servers.rooms.messages.send(...)` call a
 * user would.
 *
 * Some methods are not available to robots (`users.me()`, friends, DMs,
 * image uploads, events). The SDK throws `LagInvalidTokenError` upfront
 * for the ones that have no robot equivalent; the rest will return `401`
 * from the API.
 *
 * The client is stateless beyond the underlying fetch implementation, so a
 * single instance is safe to share across requests / workers.
 */
export class LagClient {
  public readonly system: SystemResource;
  public readonly users: UsersResource;
  public readonly friends: FriendsResource;
  public readonly dms: DmsResource;
  public readonly servers: ServersResource;
  public readonly events: EventsResource;
  public readonly images: ImagesResource;

  private readonly http: HttpClient;

  constructor(options: LagClientOptions) {
    this.http = new HttpClient(options);
    this.system = new SystemResource(this.http);
    this.users = new UsersResource(this.http);
    this.friends = new FriendsResource(this.http);
    this.dms = new DmsResource(this.http);
    this.servers = new ServersResource(this.http);
    this.events = new EventsResource(this.http);
    this.images = new ImagesResource(this.http);
  }

  /** True when the client is configured with a robot API key. */
  get isRobot(): boolean {
    return this.http.isRobot;
  }

  /**
   * Return a unified `Identity` for the calling credential.
   *
   * Works for both user PATs and robot keys. For users this hits
   * `GET /users/me`; for robots it hits `GET /robots/@me/info`. Inspect
   * `Identity.kind` if you need to branch on user-vs-robot.
   */
  async identity(): Promise<Identity> {
    if (this.http.isRobot) {
      const raw = await this.http.request<RobotInfo>({
        method: 'GET',
        path: '/robots/@me/info',
      });
      return identityFromRobot(raw);
    }
    const raw = await this.http.request<User>({ method: 'GET', path: '/users/me' });
    return identityFromUser(raw);
  }
}

function identityFromUser(raw: User): Identity {
  return {
    id: raw.id,
    kind: 'user',
    displayName: raw.displayName ?? raw.username ?? '',
    avatarUrl: raw.avatarUrl ?? null,
    createdAt: raw.createdAt ?? null,
    username: raw.username ?? null,
    serverId: null,
    permissions: null,
    active: null,
  };
}

function identityFromRobot(raw: RobotInfo): Identity {
  return {
    id: raw.id,
    kind: 'robot',
    displayName: raw.name ?? '',
    avatarUrl: raw.avatarUrl ?? null,
    createdAt: raw.createdAt ?? null,
    username: null,
    serverId: raw.serverId ?? null,
    permissions: raw.permissions ?? null,
    active: raw.active ?? null,
  };
}
