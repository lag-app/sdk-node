import { HttpClient, type LagClientOptions } from './http.js';
import { SystemResource } from './resources/system.js';
import { UsersResource } from './resources/users.js';
import { FriendsResource } from './resources/friends.js';
import { DmsResource } from './resources/dms.js';
import { ServersResource } from './resources/servers.js';
import { EventsResource } from './resources/events.js';
import { ImagesResource } from './resources/images.js';

/**
 * The Lag SDK entry point.
 *
 * Construct it with a bearer token (a Personal Access Token, format
 * `lag_pat_*`, or a Supabase JWT) and access resources off the instance:
 *
 *   ```ts
 *   import { LagClient } from '@lag/sdk';
 *
 *   const client = new LagClient({ token: process.env.LAG_TOKEN! });
 *   const me = await client.users.me();
 *   const servers = await client.servers.list();
 *   ```
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

  constructor(options: LagClientOptions) {
    const http = new HttpClient(options);
    this.system = new SystemResource(http);
    this.users = new UsersResource(http);
    this.friends = new FriendsResource(http);
    this.dms = new DmsResource(http);
    this.servers = new ServersResource(http);
    this.events = new EventsResource(http);
    this.images = new ImagesResource(http);
  }
}
