import type { User } from './user.js';
import type { MessageImage, MessageReplyTo } from './room.js';

export interface DmMessage {
  id: string;
  conversationId: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  replyTo?: MessageReplyTo | null;
  image?: MessageImage | null;
}

export interface DmConversation {
  id: string;
  otherUser: User;
  lastMessage: DmMessage | null;
  createdAt: string;
}

export interface CreateDmBody {
  userId: string;
}

export interface SendDmMessageBody {
  content: string;
  replyToId?: string;
  imageId?: string;
}

export interface EditDmMessageBody {
  content: string;
}
