import * as core from '@actions/core';
import { Octokit } from '@octokit/action';
import { catchError, concatMap, EMPTY, from, map, mergeMap } from 'rxjs';
import { checkPushEventEnv } from './github-env';
import { LabelSet } from './label-set';
import { applyLabels, checkBehindLabel, checkConflictLabel, removeLabels } from './labels';
import { checkMergeability } from './util';

export const handlePush = async (): Promise<void> => {
	// Grab context from the CI environment
	const { owner, repo } = await checkPushEventEnv();

	// Create a GitHub client using the token passed via an ENV in the workflow YAML
	const octokit = new Octokit({ previews: ['merge-info-preview'] });

	from(octokit.pulls.list({ owner, repo, state: 'open' }))
		.pipe(
			concatMap(pulls => from(pulls.data)),

			// Wait for PR mergeability check
			mergeMap(pull =>
				checkMergeability(octokit, { owner, repo, pull_number: pull.number }).pipe(
					catchError((err: unknown) => {
						core.error(`error checking mergeability of PR#${pull.number}: ${err}`);
						return EMPTY;
					}),
				),
			),

			map(pull => {
				const pull_number = pull.number;
				const labels = pull.labels.map(({ name }) => name);

				core.info(`>> ${pull_number} Labels that we have: ${JSON.stringify(labels)}`);

				const labelSet = LabelSet.merge([checkBehindLabel(pull), checkConflictLabel(pull)]);

				const overlap = [...labelSet.toAddAndRemove()];
				if (overlap.length > 0) {
					core.warning(
						`>> ${pull_number} Warning: The following labels were queued to be added AND removed: ${overlap}`,
					);
				}

				return {
					pull_number,
					labels,
					toAdd: [...labelSet.toAdd()],
					toRemove: [...labelSet.toRemove()],
				};
			}),

			mergeMap(async ({ pull_number, labels, toAdd, toRemove }): Promise<number> => {
				core.info(`>> ${pull_number} Labels that we want: ${JSON.stringify(toAdd)}`);
				await applyLabels(octokit, owner, repo, pull_number, labels, toAdd);

				core.info(`>> ${pull_number} Labels that we don't want: ${JSON.stringify(toRemove)}`);
				await removeLabels(octokit, owner, repo, pull_number, labels, toRemove);

				return pull_number;
			}),
		)
		.subscribe({
			next: pull_number => core.info(`>> ${pull_number} Complete`),
			error: (err: unknown) => core.warning(err instanceof Error ? err : `${err}`),
		});
};
