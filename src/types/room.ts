/**
 * Image variant returned alongside chat messages and stand-alone images.
 * Variants represent processed sizes (thumb, small, medium, etc.) the API
 * generated when the image was uploaded.
 */
export interface MessageImageVariant {
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface MessageImage {
  id: string;
  url: string | null;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  contentType: string;
  variants: Record<string, MessageImageVariant> | null;
}

export interface MessageReplyTo {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  content: string;
  robotId?: string | null;
  robotName?: string | null;
  isBot?: boolean;
}

export interface MentionData {
  type: 'user' | 'robot';
  id: string;
  name: string;
}

/**
 * A "room" in Lag is a server-scoped voice room that doubles as a text
 * channel. The same model is used for messages, presence, and (when joined)
 * voice tokens. The voice side of this is intentionally not exposed by the
 * REST SDK; consumers integrate voice through the dedicated voice client.
 */
export interface Room {
  id: string;
  serverId: string;
  name: string | null;
  createdBy: string;
  maxParticipants: number | null;
  participants: RoomParticipant[];
  createdAt: string;
}

export interface RoomParticipant {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  joinedAt: string;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  userId: string | null;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  robotId?: string | null;
  robotName?: string | null;
  robotAvatarUrl?: string | null;
  isBot?: boolean;
  guestId?: string | null;
  guestDisplayName?: string | null;
  isGuest?: boolean;
  replyTo?: MessageReplyTo | null;
  mentions?: MentionData[] | null;
  image?: MessageImage | null;
}

export interface CreateRoomBody {
  name: string;
  maxParticipants?: number;
}

export interface UpdateRoomBody {
  name?: string;
  maxParticipants?: number;
}

export interface SendRoomMessageBody {
  content?: string;
  replyToId?: string;
  imageId?: string;
}

export interface EditRoomMessageBody {
  content: string;
}
