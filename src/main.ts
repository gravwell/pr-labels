import * as core from '@actions/core';
import { handlePR } from './lib/handle-pr';
import { handlePush } from './lib/handle-push';

/** Entrypoint */
async function run(): Promise<void> {
	try {
		if (!process.env.INPUT_GITHUB_TOKEN) {
			core.setFailed('Missing GITHUB_TOKEN variable');
			return;
		}

		switch (process.env.GITHUB_EVENT_NAME) {
			case 'pull_request_target':
				core.info('PR: Checking PR labels...');
				await handlePR();
				break;
			case 'push':
				core.info('Push: Checking PR labels...');
				await handlePush();
				break;
			default:
				core.setFailed(`Unable to run on a ${process.env.GITHUB_EVENT_NAME} event`);
				break;
		}
	} catch (err) {
		core.setFailed(err instanceof Error ? err : `${err}`);
	}
}

run();
