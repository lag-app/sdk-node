import type { HttpClient } from '../http.js';
import type {
  CreateEventBody,
  EventSummary,
  RsvpBody,
  RsvpResponse,
  UpdateEventBody,
} from '../types/event.js';
import { EventGuestsResource } from './event-guests.js';
import { EventTemplatesResource } from './event-templates.js';

/**
 * Events resource: scheduled voice events that belong to a server.
 *
 * The Lag API mounts events under `/servers/:id/events/...` (and templates
 * under `/servers/:id/event-templates/...`), so every method here takes a
 * `serverId`. The two sub-resources `guests` and `templates` follow the
 * same pattern.
 */
export class EventsResource {
  public readonly guests: EventGuestsResource;
  public readonly templates: EventTemplatesResource;

  constructor(private readonly http: HttpClient) {
    this.guests = new EventGuestsResource(http);
    this.templates = new EventTemplatesResource(http);
  }

  /** GET /servers/:id/events - upcoming and active events in a server. */
  list(serverId: string): Promise<{ events: EventSummary[] }> {
    return this.http.request<{ events: EventSummary[] }>({
      method: 'GET',
      path: `/servers/${encodeURIComponent(serverId)}/events`,
    });
  }

  /** POST /servers/:id/events - create a new event. */
  create(serverId: string, body: CreateEventBody): Promise<EventSummary> {
    return this.http.request<EventSummary>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(serverId)}/events`,
      body,
    });
  }

  /** GET /servers/:id/events/:eventId - event detail. */
  get(serverId: string, eventId: string): Promise<EventSummary> {
    return this.http.request<EventSummary>({
      method: 'GET',
      path: `/servers/${encodeURIComponent(serverId)}/events/${encodeURIComponent(eventId)}`,
    });
  }

  /** PATCH /servers/:id/events/:eventId - update event metadata. */
  update(
    serverId: string,
    eventId: string,
    body: UpdateEventBody,
  ): Promise<EventSummary> {
    return this.http.request<EventSummary>({
      method: 'PATCH',
      path: `/servers/${encodeURIComponent(serverId)}/events/${encodeURIComponent(eventId)}`,
      body,
    });
  }

  /** DELETE /servers/:id/events/:eventId - cancel an event (soft delete). */
  cancel(
    serverId: string,
    eventId: string,
  ): Promise<{ status: string; deletesAt?: string }> {
    return this.http.request<{ status: string; deletesAt?: string }>({
      method: 'DELETE',
      path: `/servers/${encodeURIComponent(serverId)}/events/${encodeURIComponent(eventId)}`,
    });
  }

  /** POST /servers/:id/events/:eventId/rsvp - set the caller's RSVP status. */
  rsvp(serverId: string, eventId: string, body: RsvpBody): Promise<RsvpResponse> {
    return this.http.request<RsvpResponse>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(serverId)}/events/${encodeURIComponent(eventId)}/rsvp`,
      body,
    });
  }

  /** POST /servers/:id/events/:eventId/external/toggle - toggle external (share-link) access. */
  toggleExternalAccess(serverId: string, eventId: string): Promise<EventSummary> {
    return this.http.request<EventSummary>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(serverId)}/events/${encodeURIComponent(eventId)}/external/toggle`,
    });
  }
}
