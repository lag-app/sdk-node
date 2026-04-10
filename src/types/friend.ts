import type { User } from './user.js';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Friend {
  id: string;
  user: User;
  friendshipId: string;
  since: string;
}

export interface IncomingFriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
  from: User;
}

export interface OutgoingFriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt: string;
  to: User;
}

export interface FriendRequestList {
  incoming: IncomingFriendRequest[];
  outgoing: OutgoingFriendRequest[];
}

export interface SendFriendRequestBody {
  username: string;
}

export interface AcceptFriendRequestBody {
  requestId: string;
}

export interface DeclineFriendRequestBody {
  requestId: string;
}

export interface BlockUserBody {
  userId: string;
}
