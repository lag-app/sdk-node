/**
 * welcome-bot.ts - greets new members in a designated welcome room.
 *
 * Subscribes to `member.join` events via long-poll and posts a friendly
 * message to the room ID you configure. Pair this with the
 * `read_members` permission and a robot subscribed to `member.join`.
 *
 * Run:
 *   npm install @lagapp/sdk
 *   LAG_ROBOT_API_KEY=lag_robot_... \
 *   LAG_WELCOME_ROOM_ID=room_xyz \
 *   tsx welcome-bot.ts
 */

import { LagClient } from '@lagapp/sdk';

const API_KEY = process.env.LAG_ROBOT_API_KEY;
const WELCOME_ROOM_ID = process.env.LAG_WELCOME_ROOM_ID;
if (!API_KEY) {
	console.error('LAG_ROBOT_API_KEY is required');
	process.exit(1);
}
if (!WELCOME_ROOM_ID) {
	console.error('LAG_WELCOME_ROOM_ID is required');
	process.exit(1);
}

const POLL_URL = `${process.env.LAG_API_BASE ?? 'https://api.trylag.com'}/robots/@me/events/poll`;

const client = new LagClient({ token: API_KEY });
const me = await client.identity();
if (me.kind !== 'robot' || !me.serverId) {
	console.error('Expected a robot key bound to a server');
	process.exit(1);
}
const SERVER_ID = me.serverId;

interface PollEvent {
	id: string;
	eventType: string;
	payload: { type: string; data: Record<string, unknown> };
}

async function welcome(username: string): Promise<void> {
	const lines = [
		`:wave: Welcome to the server, **${username}**!`,
		`Take a look around, introduce yourself, and ping a moderator if you need anything.`,
	];
	await client.servers.rooms.messages.send(SERVER_ID, WELCOME_ROOM_ID!, {
		content: lines.join('\n'),
	});
}

async function handleEvent(event: PollEvent): Promise<void> {
	if (event.eventType !== 'member.join') return;
	const username = (event.payload.data as { username?: string }).username;
	if (!username) return;
	console.log(`-> ${username} joined, posting welcome`);
	await welcome(username);
}

async function pollLoop(): Promise<never> {
	console.log(`Watching for new members on server ${SERVER_ID}...`);
	for (;;) {
		try {
			const res = await fetch(POLL_URL, {
				headers: { Authorization: `Robot ${API_KEY}` },
			});
			if (!res.ok) {
				console.error(`Poll failed: HTTP ${res.status}`);
				await sleep(5000);
				continue;
			}
			const events = (await res.json()) as PollEvent[];
			for (const event of events) {
				await handleEvent(event);
			}
		} catch (err) {
			console.error('Poll error:', err);
			await sleep(5000);
		}
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

await pollLoop();
