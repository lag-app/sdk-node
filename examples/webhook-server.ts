// @ts-nocheck - this example imports `express` which is a peer dependency
// (not installed in the SDK repo's node_modules). Run `npm install express`
// in your own project before running this file. The logic is plain
// JavaScript at runtime.
/**
 * webhook-server.ts - production-grade webhook receiver.
 *
 * Runs an Express server that:
 *   1. Receives webhook deliveries on POST /webhook
 *   2. Verifies the Standard-Webhooks signature using your whsec_ secret
 *   3. Dispatches `room.message` events to a small command handler
 *   4. Replies through the SDK using your robot API key
 *
 * Pair with a robot configured with `transportType: 'webhook'` and a
 * `webhookUrl` that points at your public HTTPS endpoint.
 *
 * Run:
 *   npm install @lagapp/sdk express
 *   npm install -D @types/express tsx typescript
 *   LAG_ROBOT_API_KEY=lag_robot_... \
 *   LAG_WEBHOOK_SECRET=whsec_... \
 *   PORT=3000 \
 *   tsx webhook-server.ts
 */

import express from 'express';
import crypto from 'node:crypto';
import { LagClient } from '@lagapp/sdk';

const API_KEY = process.env.LAG_ROBOT_API_KEY;
const WEBHOOK_SECRET = process.env.LAG_WEBHOOK_SECRET;
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const TIMESTAMP_TOLERANCE_SEC = 300; // 5 minutes

if (!API_KEY) {
	console.error('LAG_ROBOT_API_KEY is required');
	process.exit(1);
}
if (!WEBHOOK_SECRET) {
	console.error('LAG_WEBHOOK_SECRET is required');
	process.exit(1);
}

const client = new LagClient({ token: API_KEY });

interface WebhookEvent {
	type: string;
	serverId: string;
	timestamp: string;
	data: Record<string, unknown>;
}

function verifySignature(payload: string, headers: express.Request['headers']): boolean {
	const msgId = headers['webhook-id'];
	const timestamp = headers['webhook-timestamp'];
	const signature = headers['webhook-signature'];
	if (typeof msgId !== 'string' || typeof timestamp !== 'string' || typeof signature !== 'string') {
		return false;
	}

	// Reject ancient or future-dated timestamps to prevent replay attacks.
	const now = Math.floor(Date.now() / 1000);
	if (Math.abs(now - parseInt(timestamp, 10)) > TIMESTAMP_TOLERANCE_SEC) {
		return false;
	}

	const secretBytes = Buffer.from(WEBHOOK_SECRET!.replace('whsec_', ''), 'base64');
	const signedContent = `${msgId}.${timestamp}.${payload}`;
	const computed = crypto
		.createHmac('sha256', secretBytes)
		.update(signedContent)
		.digest('base64');
	const expected = `v1,${computed}`;

	// Multiple signatures may appear during secret rotation. Constant-time
	// compare each candidate to avoid timing leaks.
	const candidates = signature.split(' ');
	const expectedBuf = Buffer.from(expected);
	for (const sig of candidates) {
		const sigBuf = Buffer.from(sig);
		if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
			return true;
		}
	}
	return false;
}

async function handleEvent(event: WebhookEvent): Promise<void> {
	if (event.type !== 'room.message') return;
	const data = event.data as { roomId?: string; content?: string; senderName?: string };
	if (!data.roomId || data.content !== '!ping') return;

	await client.servers.rooms.messages.send(event.serverId, data.roomId, {
		content: `:ping_pong: pong! hi ${data.senderName ?? 'there'}`,
	});
}

const app = express();
// Important: use raw bytes so the signature check verifies the EXACT payload
// the server signed. JSON-parsing first would re-serialize and break HMAC.
app.use('/webhook', express.raw({ type: 'application/json' }));

app.post('/webhook', async (req, res) => {
	const payload = (req.body as Buffer).toString('utf8');

	if (!verifySignature(payload, req.headers)) {
		return res.status(401).send('Invalid signature');
	}

	let event: WebhookEvent;
	try {
		event = JSON.parse(payload) as WebhookEvent;
	} catch {
		return res.status(400).send('Invalid JSON');
	}

	// Ack the delivery FIRST, then process. Ack timeouts cause retries; we
	// don't want a slow handler to trigger a duplicate delivery.
	res.status(200).send('OK');

	handleEvent(event).catch((err) => {
		console.error(`Failed to handle ${event.type}:`, err);
	});
});

app.get('/', (_req, res) => res.send('Lag webhook receiver running'));

app.listen(PORT, () => {
	console.log(`Webhook server listening on http://localhost:${PORT}`);
	console.log(`Configure your robot's webhookUrl to: https://YOUR_HOST/webhook`);
});
