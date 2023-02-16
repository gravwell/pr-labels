import * as core from '@actions/core';
import { Octokit } from '@octokit/action';
import { firstValueFrom } from 'rxjs';
import { checkPullEventEnv } from './github-env';
import { LabelSet } from './label-set';
import { applyLabels, checkBehindLabel, checkConflictLabel, removeLabels } from './labels';
import { checkMergeability } from './util';

export const handlePR = async (): Promise<void> => {
	// Grab context from the CI environment
	const { event, owner, repo } = await checkPullEventEnv();
	const pull_number = event.pull_request.number;

	// Create a GitHub client using the token passed via an ENV in the workflow YAML
	const octokit = new Octokit({ previews: ['merge-info-preview'] });

	// Wait for the pull's mergeability check to finish
	const pullRequest = await firstValueFrom(checkMergeability(octokit, { owner, repo, pull_number }));

	// Use octokit to query for info about the pull request
	const labels = pullRequest.labels.map(({ name }) => name);

	core.info(`>> Labels that we have: ${JSON.stringify(labels)}`);

	const labelSet = LabelSet.merge([checkBehindLabel(pullRequest), checkConflictLabel(pullRequest)]);

	const overlap = [...labelSet.toAddAndRemove()];
	if (overlap.length > 0) {
		core.warning(`>> Warning: The following labels were queued to be added AND removed: ${overlap}`);
	}

	const toAdd = [...labelSet.toAdd()];
	core.info(`>> Labels that we want: ${JSON.stringify(toAdd)}`);
	await applyLabels(octokit, owner, repo, pull_number, labels, toAdd);

	const toRemove = [...labelSet.toRemove()];
	core.info(`>> Labels that we don't want: ${JSON.stringify(toRemove)}`);
	await removeLabels(octokit, owner, repo, pull_number, labels, toRemove);

	core.info('>> Complete');
};
