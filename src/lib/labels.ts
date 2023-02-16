import * as core from '@actions/core';
import { Octokit } from '@octokit/action';
import { LabelSet } from './label-set';
import { OctokitPullRequest } from './util';

// eslint-disable-next-line no-shadow
export enum Labels {
	Behind = 'behind',
	HasConflict = 'conflict',
}

/**
 * Add the "behind" label if necessary, or remove it if it's no longer
 * necessary
 */
export const checkBehindLabel = (pullRequest: OctokitPullRequest): LabelSet => {
	const set = new LabelSet();

	const prInfo = {
		isDraft: pullRequest.draft,
		mergeable: pullRequest.mergeable,
		mergeStateStatus: pullRequest.mergeable_state,
	};
	core.info(`>> ${pullRequest.number} "${Labels.Behind}" label check on PR: ${JSON.stringify(prInfo)}`);

	if (pullRequest.mergeable_state.toLowerCase() === 'behind') {
		set.addLabel(Labels.Behind);
	} else {
		set.removeLabel(Labels.Behind);
	}

	core.info(`>> ${pullRequest.number} "${Labels.Behind}" label check result: ${set.toString()}`);

	return set;
};

/**
 * Add the "conflict" label if necessary, or remove it if it's no longer
 * necessary
 */
export const checkConflictLabel = (pullRequest: OctokitPullRequest): LabelSet => {
	const set = new LabelSet();

	const mergeability = {
		mergeable: pullRequest.mergeable,
	};

	core.info(`>> ${pullRequest.number} "${Labels.HasConflict}" label check: ${JSON.stringify(mergeability)}`);

	if (pullRequest.mergeable === false) {
		set.addLabel(Labels.HasConflict);
	} else {
		set.removeLabel(Labels.HasConflict);
	}

	core.info(`>> ${pullRequest.number} "${Labels.HasConflict}" label check result: ${set.toString()}`);

	return set;
};

export const applyLabels = async (
	octokit: Octokit,
	owner: string,
	repo: string,
	pull_number: number,
	currentLabels: readonly string[],
	wantedLabels: readonly string[],
): Promise<void> => {
	const alreadyHave: ReadonlySet<string> = new Set(currentLabels);
	const wanted: ReadonlySet<string> = new Set(wantedLabels);

	// We need to apply those labels that we want but don't have yet
	const needApplied = [...wanted].filter(x => !alreadyHave.has(x));

	core.info(`>> ${pull_number} Adding labels: ${JSON.stringify(needApplied)}`);

	if (needApplied.length === 0) {
		return;
	}

	await octokit.issues.addLabels({
		owner,
		repo,
		issue_number: pull_number,
		labels: needApplied,
	});

	return;
};

export const removeLabels = async (
	octokit: Octokit,
	owner: string,
	repo: string,
	pull_number: number,
	currentLabels: readonly string[],
	unwantedLabels: readonly string[],
): Promise<void> => {
	const alreadyHave: ReadonlySet<string> = new Set(currentLabels);
	const unwanted: ReadonlySet<string> = new Set(unwantedLabels);

	// We need to remove those labels that we don't want, but still have
	const needRemoved = [...unwanted].filter(x => alreadyHave.has(x));

	core.info(`>> ${pull_number} Removing labels: ${JSON.stringify(needRemoved)}`);

	if (needRemoved.length === 0) {
		return;
	}

	await Promise.all(
		needRemoved.map(async label =>
			octokit.issues.removeLabel({
				owner,
				repo,
				issue_number: pull_number,
				name: label,
			}),
		),
	);

	return;
};
