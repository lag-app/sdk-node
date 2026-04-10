import type { HttpClient } from '../http.js';
import type {
  Friend,
  FriendRequestList,
  Friendship,
} from '../types/friend.js';

/**
 * Friends resource. Friend requests are a one-way handshake initiated by
 * username; once accepted, both sides see the friendship in `list()`.
 *
 * Note: removing a friendship and cancelling a pending outbound request both
 * use `DELETE /friends/:id` - the API distinguishes them internally based on
 * the friendship state.
 */
export class FriendsResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /friends - all accepted friendships. */
  list(): Promise<Friend[]> {
    return this.http.request<Friend[]>({ method: 'GET', path: '/friends' });
  }

  /** GET /friends/requests - pending requests in both directions. */
  requests(): Promise<FriendRequestList> {
    return this.http.request<FriendRequestList>({ method: 'GET', path: '/friends/requests' });
  }

  /** POST /friends/request - send a friend request to a user by username. */
  sendRequest(username: string): Promise<Friendship> {
    return this.http.request<Friendship>({
      method: 'POST',
      path: '/friends/request',
      body: { username },
    });
  }

  /** POST /friends/accept - accept an incoming friend request. */
  accept(requestId: string): Promise<Friendship> {
    return this.http.request<Friendship>({
      method: 'POST',
      path: '/friends/accept',
      body: { requestId },
    });
  }

  /** POST /friends/decline - decline an incoming friend request. */
  decline(requestId: string): Promise<void> {
    return this.http.request<void>({
      method: 'POST',
      path: '/friends/decline',
      body: { requestId },
    });
  }

  /**
   * DELETE /friends/:id - remove a friend OR cancel a pending outbound request.
   * The friendship ID is what `list()` and `requests().outgoing[*].id` return.
   */
  remove(friendshipId: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/friends/${encodeURIComponent(friendshipId)}`,
    });
  }

  /** POST /friends/block - block another user (creates or updates a friendship row). */
  block(userId: string): Promise<Friendship> {
    return this.http.request<Friendship>({
      method: 'POST',
      path: '/friends/block',
      body: { userId },
    });
  }
}
