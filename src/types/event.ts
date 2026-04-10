export type EventStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';
export type RsvpStatus = 'going' | 'maybe' | 'not_going';
export type EventGuestStatus = 'pending' | 'admitted' | 'rejected';

export interface RsvpCounts {
  going: number;
  maybe: number;
  notGoing: number;
}

export interface EventSummary {
  id: string;
  serverId: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  status: EventStatus;
  voiceRoomId: string | null;
  createdBy: string;
  creatorUsername: string;
  creatorDisplayName: string | null;
  shareCode: string | null;
  externalAccessEnabled: boolean;
  externalAutoAdmit: boolean;
  rsvpCounts: RsvpCounts;
  myRsvp: RsvpStatus | null;
  templateId: string | null;
  createdAt: string;
}

export interface EventGuest {
  id: string;
  displayName: string;
  generatedUsername: string;
  status: EventGuestStatus;
  createdAt: string;
}

export interface EventTemplate {
  id: string;
  serverId: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  durationMinutes: number | null;
  rrule: string;
  timezone: string;
  startTime: string;
  externalAccessEnabled: boolean;
  externalAutoAdmit: boolean;
  nextOccurrenceAt: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CreateEventBody {
  title: string;
  description?: string;
  coverImageUrl?: string;
  startsAt: string;
  endsAt?: string;
  externalAccessEnabled?: boolean;
  externalAutoAdmit?: boolean;
}

export interface UpdateEventBody {
  title?: string;
  description?: string;
  coverImageUrl?: string;
  startsAt?: string;
  endsAt?: string;
  externalAccessEnabled?: boolean;
  externalAutoAdmit?: boolean;
}

export interface RsvpBody {
  status: RsvpStatus;
}

export interface RsvpResponse {
  status: RsvpStatus;
  counts: RsvpCounts;
}

export interface CreateEventTemplateBody {
  title: string;
  description?: string;
  rrule: string;
  timezone: string;
  /** Time-of-day in HH:MM (24h) format. */
  startTime: string;
  durationMinutes?: number;
  coverImageUrl?: string;
  externalAccessEnabled?: boolean;
  externalAutoAdmit?: boolean;
}

export interface UpdateEventTemplateBody {
  title?: string;
  description?: string;
  rrule?: string;
  timezone?: string;
  startTime?: string;
  durationMinutes?: number;
  coverImageUrl?: string;
  externalAccessEnabled?: boolean;
  externalAutoAdmit?: boolean;
}
