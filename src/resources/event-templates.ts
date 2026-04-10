import type { HttpClient } from '../http.js';
import type {
  CreateEventTemplateBody,
  EventTemplate,
  UpdateEventTemplateBody,
} from '../types/event.js';

/**
 * Event templates sub-resource. Templates encode a recurring event using
 * an iCalendar `RRULE` plus a timezone and a HH:MM start-of-day time. The
 * server materializes individual events 48h ahead via a background job.
 */
export class EventTemplatesResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /servers/:id/event-templates - list all recurring templates in a server. */
  list(serverId: string): Promise<{ templates: EventTemplate[] }> {
    return this.http.request<{ templates: EventTemplate[] }>({
      method: 'GET',
      path: `/servers/${encodeURIComponent(serverId)}/event-templates`,
    });
  }

  /** POST /servers/:id/event-templates - create a new recurring template. */
  create(serverId: string, body: CreateEventTemplateBody): Promise<EventTemplate> {
    return this.http.request<EventTemplate>({
      method: 'POST',
      path: `/servers/${encodeURIComponent(serverId)}/event-templates`,
      body,
    });
  }

  /** PATCH /servers/:id/event-templates/:templateId - update an existing template. */
  update(
    serverId: string,
    templateId: string,
    body: UpdateEventTemplateBody,
  ): Promise<EventTemplate> {
    return this.http.request<EventTemplate>({
      method: 'PATCH',
      path: `/servers/${encodeURIComponent(serverId)}/event-templates/${encodeURIComponent(templateId)}`,
      body,
    });
  }

  /** DELETE /servers/:id/event-templates/:templateId - delete a template and its scheduled events. */
  delete(serverId: string, templateId: string): Promise<{ ok: true }> {
    return this.http.request<{ ok: true }>({
      method: 'DELETE',
      path: `/servers/${encodeURIComponent(serverId)}/event-templates/${encodeURIComponent(templateId)}`,
    });
  }
}
