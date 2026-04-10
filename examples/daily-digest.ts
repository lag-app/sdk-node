/**
 * daily-digest.ts - posts a daily summary of room activity.
 *
 * Walks the last 24 hours of messages from a source room using the
 * SDK's pagination iterator, computes a tiny set of stats (total
 * messages, top posters), and posts a Markdown summary to a digest
 * room. Designed to be run on a cron schedule (daily at midnight UTC,
 * etc.) - it's a one-shot script, not a long-running daemon.
 *
 * Run:
 *   npm install @lagapp/sdk
 *   LAG_ROBOT_API_KEY=lag_robot_... \
 *   LAG_SOURCE_ROOM_ID=room_general \
 *   LAG_DIGEST_ROOM_ID=room_announcements \
 *   tsx daily-digest.ts
 *
 * Permissions required: read_messages, send_messages
 */

import { LagClient } from '@lagapp/sdk';

const API_KEY = process.env.LAG_ROBOT_API_KEY;
const SOURCE_ROOM_ID = process.env.LAG_SOURCE_ROOM_ID;
const DIGEST_ROOM_ID = process.env.LAG_DIGEST_ROOM_ID;
if (!API_KEY) {
	console.error('LAG_ROBOT_API_KEY is required');
	process.exit(1);
}
if (!SOURCE_ROOM_ID) {
	console.error('LAG_SOURCE_ROOM_ID is required');
	process.exit(1);
}
if (!DIGEST_ROOM_ID) {
	console.error('LAG_DIGEST_ROOM_ID is required');
	process.exit(1);
}

const client = new LagClient({ token: API_KEY });
const me = await client.identity();
if (me.kind !== 'robot' || !me.serverId) {
	console.error('Expected a robot key bound to a server');
	process.exit(1);
}
const SERVER_ID = me.serverId;

const HORIZON_MS = 24 * 60 * 60 * 1000;
const cutoff = Date.now() - HORIZON_MS;

interface Stats {
	total: number;
	posters: Map<string, number>;
}

const stats: Stats = { total: 0, posters: new Map() };

// Pagination walks back through history, oldest-newest within each page.
// We stop as soon as we cross the 24h boundary - the iterator yields pages
// in reverse-chronological order (newest first), so once we see a message
// older than the cutoff we know everything else is too.
walk: for await (const page of client.servers.rooms.messages.iter(SERVER_ID, SOURCE_ROOM_ID, {
	limit: 100,
})) {
	for (const message of page.items) {
		const ts = Date.parse(message.createdAt);
		if (ts < cutoff) break walk;
		// Skip the bot's own messages so the digest doesn't count itself.
		if (message.robotId === me.id) continue;
		stats.total += 1;
		const poster = message.displayName ?? message.username;
		stats.posters.set(poster, (stats.posters.get(poster) ?? 0) + 1);
	}
}

const top = [...stats.posters.entries()]
	.sort((a, b) => b[1] - a[1])
	.slice(0, 5)
	.map(([name, count], i) => `${i + 1}. **${name}** - ${count} message${count === 1 ? '' : 's'}`)
	.join('\n');

const sinceLabel = new Date(cutoff).toISOString();

const summary = [
	`:bar_chart: **Daily digest**`,
	``,
	`**${stats.total}** messages since ${sinceLabel}`,
	``,
	stats.posters.size > 0 ? `**Top posters**\n${top}` : '_No activity in the last 24 hours._',
].join('\n');

const posted = await client.servers.rooms.messages.send(SERVER_ID, DIGEST_ROOM_ID, {
	content: summary,
});

console.log(`Posted digest as message ${posted.id}`);
console.log(`Counted ${stats.total} messages from ${stats.posters.size} unique posters`);
