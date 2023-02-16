import * as fs from 'fs/promises';
import { Decoder, object, positiveInteger, string } from 'decoders';

/**
 * Pull request event details
 * https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request
 * https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request
 */
export type PullEvent = {
	readonly pull_request: {
		readonly number: number;
	};
};

export const pullEvent: Decoder<PullEvent> = object({
	pull_request: object({
		number: positiveInteger,
	}),
});

/** Returns pull request event values gathered from CI environment variables */
export const checkPullEventEnv = async (): Promise<{ event: PullEvent; owner: string; repo: string }> => {
	const eventPath = process.env.GITHUB_EVENT_PATH;
	if (!eventPath) {
		throw new Error('Expected non-nil event path');
	}

	const repoPath = process.env.GITHUB_REPOSITORY;
	if (!repoPath) {
		throw new Error('Expected non-nil repo path');
	}

	const buf = await fs.readFile(eventPath);
	const value = JSON.parse(buf.toString());
	const event = pullEvent.verify(value);
	const [owner, repo] = repoPath.split('/');

	return { event, owner, repo };
};

/**
 * Push event details
 * https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#push
 * https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#push
 */
export type PushEvent = { ref: string };

export const pushEvent: Decoder<PushEvent> = object({ ref: string });

/** Returns push event values gathered from CI environment variables */
export const checkPushEventEnv = async (): Promise<{ event: PushEvent; owner: string; repo: string }> => {
	const eventPath = process.env.GITHUB_EVENT_PATH;
	if (!eventPath) {
		throw new Error('Expected non-nil event path');
	}

	const repoPath = process.env.GITHUB_REPOSITORY;
	if (!repoPath) {
		throw new Error('Expected non-nil repo path');
	}

	const buf = await fs.readFile(eventPath);
	const value = JSON.parse(buf.toString());
	const event = pushEvent.verify(value);
	const [owner, repo] = repoPath.split('/');

	return { event, owner, repo };
};
