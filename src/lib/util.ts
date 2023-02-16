import * as core from '@actions/core';
import { Octokit, RestEndpointMethodTypes } from '@octokit/action';
import { concatMap, defer, first, from, map, Observable, retry, tap, timer } from 'rxjs';

export type OctokitPullRequest = RestEndpointMethodTypes['pulls']['get']['response']['data'];

/**
 * AFTER starting the background job... poll until `mergeable` is not null
 */
const poll = (
	octokit: Octokit,
	{ owner, repo, pull_number }: { owner: string; repo: string; pull_number: number },
): Observable<OctokitPullRequest> => {
	core.debug('begin polling');

	return defer(() => {
		core.debug('poll');
		return from(octokit.pulls.get({ owner, repo, pull_number }));
	}).pipe(
		tap(p => {
			core.debug(`poll result: ${{ mergeable: p.data.mergeable, mergeable_state: p.data.mergeable_state }}`);
			if (p.data.mergeable === null) {
				throw new Error(`PR#${p.data.number} - Mergeability is not ready`);
			}
			core.debug(`done polling`);
		}),

		retry({
			delay: (error: unknown, retryCount: number) => {
				if (retryCount >= 10) {
					core.debug(`reached max retry count`);
					throw new Error(`PR#${pull_number} - Field "mergeable" is still null after 10 retries. Giving up.`);
				}

				core.debug(`sleep 10 sec; prepare to retry: ${{ error, retryCount }}`);
				return timer(10_000);
			},
		}),

		map(pr => pr.data),
	);
};

/**
 *  Trigger mergeability check
 *
 *  Follows this advice: https://docs.github.com/en/rest/guides/using-the-rest-api-to-interact-with-your-git-database?apiVersion=2022-11-28#checking-mergeability-of-pull-requests
 */
export const checkMergeability = (
	octokit: Octokit,
	{ owner, repo, pull_number }: { owner: string; repo: string; pull_number: number },
): Observable<OctokitPullRequest> => {
	core.debug('initial call to start mergeability backgroung job');
	return from(
		octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
			owner,
			repo,
			pull_number,
			headers: {
				'X-GitHub-Api-Version': '2022-11-28',
			},
		}),
	).pipe(
		tap(() => {
			core.debug('initial call complete');
		}),

		concatMap(() => {
			// Sleep to give GitHub time to think
			core.debug('sleep 10 sec');
			return timer(10_000);
		}),

		concatMap(() => poll(octokit, { owner, repo, pull_number })),

		first(),
	);
};
