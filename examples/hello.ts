/**
 * hello.ts - the smallest possible Lag robot.
 *
 * Authenticates with a robot API key, fetches the robot's own identity,
 * and posts a single "hello world" message into a room.
 *
 * Run:
 *   npm install @lagapp/sdk
 *   LAG_ROBOT_API_KEY=lag_robot_... \
 *   LAG_ROOM_ID=room_xyz \
 *   tsx hello.ts
 */

import { LagClient } from '@lagapp/sdk';

const apiKey = process.env.LAG_ROBOT_API_KEY;
const roomId = process.env.LAG_ROOM_ID;

if (!apiKey) {
	console.error('LAG_ROBOT_API_KEY is required');
	process.exit(1);
}
if (!roomId) {
	console.error('LAG_ROOM_ID is required');
	process.exit(1);
}

const client = new LagClient({ token: apiKey });

const me = await client.identity();
if (me.kind !== 'robot') {
	console.error('Expected a robot key, got a user PAT');
	process.exit(1);
}

console.log(`Authenticated as ${me.displayName} (${me.id})`);
console.log(`Server: ${me.serverId}`);
console.log(`Permissions: ${me.permissions?.join(', ') ?? '(none)'}`);

const message = await client.servers.rooms.messages.send(me.serverId!, roomId, {
	content: `Hello from ${me.displayName}! :wave:`,
});

console.log(`Sent message ${message.id}`);
