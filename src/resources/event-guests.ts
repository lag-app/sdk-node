import type { HttpClient } from '../http.js';
import type { EventGuest } from '../types/event.js';

/**
 * Event guests sub-resource. Reachable via `client.events.guests`.
 *
 * "Guest" here means an external (unauthenticated) joiner who requested
 * access via an event share link. Listing/admitting/rejecting are host
 * actions and require server membership plus event-creator-or-MANAGE_EVENTS.
 *
 * The guest-side flow (joining as a guest, fetching a voice token without
 * auth) is intentionally not exposed - it lives outside the public REST
 * surface a token-bearing client cares about.
 */
export class EventGuestsResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /servers/:id/events/:eventId/guests - list pending and resolved guests. */
  list(serverId: string, eventId: string): Promise<{ guests: EventGuest[] }> {
    return this.http.request<{ guests: EventGuest[] }>({
      method: 'GET',
      path: `/servers/${encodeURIComponent(serverId)}/events/${encodeURIComponent(eventId)}/guests`,
    });
  }

  /** POST /servers/:id/events/:eventId/guests/:guestId/admit - approve a waiting guest. */
  admit(
    serverId: string,
    eventId: string,
    guestId: string,
  ): Promise<{ status: 'admitted' }> {
    return this.http.request<{ status: 'admitted' }>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(serverId)}/events/${encodeURIComponent(eventId)}/guests/${encodeURIComponent(guestId)}/admit`,
    });
  }

  /** POST /servers/:id/events/:eventId/guests/:guestId/reject - reject a waiting guest. */
  reject(
    serverId: string,
    eventId: string,
    guestId: string,
  ): Promise<{ status: 'rejected' }> {
    return this.http.request<{ status: 'rejected' }>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(serverId)}/events/${encodeURIComponent(eventId)}/guests/${encodeURIComponent(guestId)}/reject`,
    });
  }
}
