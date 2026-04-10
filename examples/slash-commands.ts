/**
 * slash-commands.ts - a long-running bot that responds to text commands.
 *
 * Polls the robot event queue (raw HTTP, since the SDK doesn't yet wrap
 * `/events/poll`) and dispatches `room.message` events to a small command
 * router. Replies are sent through the SDK so the auth header, retries,
 * and path rewriting are all handled for you.
 *
 * Built-in commands:
 *   !ping              - replies "pong"
 *   !roll [N]          - rolls a 1-N die (default 6)
 *   !time              - replies with the current ISO timestamp
 *   !help              - lists available commands
 *
 * Run:
 *   npm install @lagapp/sdk
 *   LAG_ROBOT_API_KEY=lag_robot_... tsx slash-commands.ts
 */

import { LagClient, LagApiError } from '@lagapp/sdk';

const API_KEY = process.env.LAG_ROBOT_API_KEY;
if (!API_KEY) {
	console.error('LAG_ROBOT_API_KEY is required');
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
	createdAt: string;
}

type Command = (args: string[], event: PollEvent) => Promise<string | null>;

const commands: Record<string, Command> = {
	ping: async () => 'pong',
	roll: async (args) => {
		const sides = Math.max(2, Math.min(1000, parseInt(args[0] ?? '6', 10) || 6));
		const roll = 1 + Math.floor(Math.random() * sides);
		return `:game_die: rolled ${roll} (1-${sides})`;
	},
	time: async () => `:clock1: ${new Date().toISOString()}`,
	help: async () => `Available commands: ${Object.keys(commands).map((c) => `!${c}`).join(', ')}`,
};

async function handleEvent(event: PollEvent): Promise<void> {
	if (event.eventType !== 'room.message') return;
	const data = event.payload.data as { roomId?: string; content?: string };
	const content = data.content;
	if (typeof content !== 'string' || !content.startsWith('!')) return;

	const parts = content.slice(1).trim().split(/\s+/);
	const name = parts[0];
	if (!name) return;
	const args = parts.slice(1);
	const command = commands[name];
	if (!command) return;

	try {
		const reply = await command(args, event);
		if (reply && data.roomId) {
			await client.servers.rooms.messages.send(SERVER_ID, data.roomId, { content: reply });
		}
	} catch (err) {
		console.error(`Command !${name} failed:`, err);
	}
}

async function pollLoop(): Promise<never> {
	console.log(`Listening for commands as ${me.displayName} on server ${SERVER_ID}...`);
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
			if (err instanceof LagApiError) {
				console.error(`Lag API error: ${err.message}`);
			} else {
				console.error('Poll error:', err);
			}
			await sleep(5000);
		}
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

await pollLoop();
