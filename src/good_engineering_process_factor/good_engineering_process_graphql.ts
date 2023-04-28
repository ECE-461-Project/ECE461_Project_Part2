import {graphql, GraphqlResponseError} from '@octokit/graphql';
import type {GraphQlQueryResponseData} from '@octokit/graphql';

interface OWNER_REPO {
  github_repo_url: string;
  owner: string | undefined;
  repo: string | undefined;
}

function get_owner_repo(github_repo_url: string): OWNER_REPO | undefined {
  try {
    const url_obj: URL = new URL(github_repo_url);
    const host: string = url_obj.host;
    let pathname: string = url_obj.pathname;
    let url_owner: string | undefined = undefined;
    let url_repo: string | undefined = undefined;
    if (host === 'github.com') {
      if (pathname.startsWith('/')) {
        pathname = pathname.slice(1);
      }
      url_owner = pathname.slice(0, pathname.indexOf('/'));
      url_repo = pathname.slice(pathname.indexOf('/') + 1);
    } else {
      return undefined;
    }
    const owner_repo: OWNER_REPO = {
      github_repo_url: github_repo_url,
      owner: url_owner,
      repo: url_repo,
    };
    if (owner_repo.owner === undefined || owner_repo.repo === undefined) {
      return undefined;
    }
    if (owner_repo.owner === '' || owner_repo.repo === '') {
      return undefined;
    }
    return owner_repo;
  } catch {
    return undefined;
  }
}

/*
	Description of how this metric is calculated:
	1. check if GITHUB_TOKEN defined, throw error if not
	2. get owner/repo strings from github URL input to be used in GraphQL queries
	3. GraphQL query to fetch total commit count of the repository
	4. GraphQL query to fetch nodes of each PR in the repository
	that was merged into master, also checking for commit count of each PR
	and whether it had an APPROVING review. First query returns first 100
	PRs and a pagination return of if there is another page and the end cursor if so.
	5. If there is more than 100 PRs, pagination loop starts. This loop
	performs a similar query to (4) but with pagination, getting the first 100
	PRs after the last end cursor.
	6. Accumulate the total count of commits by adding when a merged PR is found that has
	a minimum of 1 approving review.
	7. Once pagination is complete, the accumulation is also completed.
	8. The final score of "% of codebase that was written with a PR and a review"
	is the accumulated commit count of each merged PR with an approving review /
	the total commit count of the repo fetched in (3).
*/

export async function fetch_score_with_graphql_data(
  github_repo_url: string
): Promise<number | undefined> {
  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error('GITHUB_TOKEN is not defined');
  }

  const owner_repo = get_owner_repo(github_repo_url);
  if (owner_repo === undefined) {
    globalThis.logger?.info(
      '%PR Factor: Could not find owner/repo for GraphQL calls!'
    );
    return undefined;
  }

  try {
    let query_result: GraphQlQueryResponseData | undefined = undefined;
    let tot_commit_count = 0;
    query_result = await graphql({
      query: `query PR_TOTCOMMIT_Query($owner: String!, $repo: String!) {
  repository(owner: $owner, name: $repo) {
    object(expression: "master") {
      ... on Commit {
        history {
          totalCount
        }
      }
    }
  }
}`,
      owner: owner_repo.owner,
      repo: owner_repo.repo,
      headers: {
        authorization: 'bearer ' + process.env.GITHUB_TOKEN,
      },
    });
    if (query_result !== undefined) {
      const jdata = JSON.parse(JSON.stringify(query_result));
      tot_commit_count = jdata.repository.object.history.totalCount;
    } else {
      globalThis.logger?.info(
        '%PR Factor: could not get total commit count of repo - returning 0.'
      );
      return 0;
    }
    if (tot_commit_count === 0) {
      globalThis.logger?.info(
        '%PR Factor: Total commit count of repo is 0 - returning 0.'
      );
      return 0;
    }

    // find commit count of PR/Reviewed commits (first pagination without loop, first 100)
    let query_result_pre_loop: GraphQlQueryResponseData | undefined = undefined;
    let tot_commit_with_reviewed_pr = 0;
    let tot_pr_count = 0;
    let has_next_page = false;
    let end_cursor = '';
    query_result_pre_loop = await graphql({
      query: `query PR_REAL_FIRST_Query($owner: String!, $repo: String!) {
  repository(owner: $owner, name: $repo) {
    pullRequests(states: MERGED, first: 100) {
      totalCount
      nodes {
        reviews(states: APPROVED) {
          totalCount
        }
        commits {
          totalCount
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
}`,
      owner: owner_repo.owner,
      repo: owner_repo.repo,
      headers: {
        authorization: 'bearer ' + process.env.GITHUB_TOKEN,
      },
    });
    if (query_result_pre_loop !== undefined) {
      const jdata = JSON.parse(JSON.stringify(query_result_pre_loop));
      // iterate through first result and determine if pagination needed
      tot_pr_count = jdata.repository.pullRequests.totalCount;
      globalThis.logger?.debug(
        `%PR Factor: Total PR count for pagination ${tot_pr_count}`
      );
      has_next_page = jdata.repository.pullRequests.pageInfo.hasNextPage;
      end_cursor = jdata.repository.pullRequests.pageInfo.endCursor;
      const nodes = jdata.repository.pullRequests.nodes;
      for (const node of nodes) {
        if (node.reviews.totalCount > 0) {
          tot_commit_with_reviewed_pr += node.commits.totalCount;
        }
      }
    } else {
      globalThis.logger?.info(
        '%PR Factor: could not get total PR count of repo - returning 0.'
      );
      return 0;
    }
    if (tot_pr_count === 0) {
      globalThis.logger?.info(
        '%PR Factor: Total PR count of repo is 0 - returning 0.'
      );
      return 0;
    }
    // loop through queries multiple times for pagination
    let loop_count = 1;
    while (has_next_page === true) {
      globalThis.logger?.debug(`%PR Looping: Paginate ${loop_count}`);
      let query_result_in_loop: GraphQlQueryResponseData | undefined =
        undefined;
      query_result_in_loop = await graphql({
        query: `query PR_LOOP_PAGINATE_Query($owner: String!, $repo: String!, $after: String!) {
  repository(owner: $owner, name: $repo) {
    pullRequests(states: MERGED, after: $after, first: 100) {
      totalCount
      nodes {
        reviews(states: APPROVED) {
          totalCount
        }
        commits {
          totalCount
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
}`,
        owner: owner_repo.owner,
        repo: owner_repo.repo,
        after: end_cursor,
        headers: {
          authorization: 'bearer ' + process.env.GITHUB_TOKEN,
        },
      });
      if (query_result_in_loop !== undefined) {
        const jdata2 = JSON.parse(JSON.stringify(query_result_in_loop));
        has_next_page = jdata2.repository.pullRequests.pageInfo.hasNextPage;
        end_cursor = jdata2.repository.pullRequests.pageInfo.endCursor;
        // iterate through each query result and determine if pagination needed
        const nodes2 = jdata2.repository.pullRequests.nodes;
        for (const node of nodes2) {
          if (node.reviews.totalCount > 0) {
            tot_commit_with_reviewed_pr += node.commits.totalCount;
          }
        }
      } else {
        globalThis.logger?.info(
          '%PR Factor: could not get query loop PR fetch of repo - returning 0.'
        );
        return 0;
      }
      loop_count++;
    }
    globalThis.logger?.debug(`%PR DONE PAGINATING LOOPS# ${loop_count}`);

    // DONE PAGINATING AND FETCHING ALL COMMITS MERGED WITH AN APPROVING REVIEW.
    // NOW CALCULATE / return METRIC
    globalThis.logger?.debug(
      `%PR CALC: ${tot_commit_with_reviewed_pr} / ${tot_commit_count}`
    );
    return tot_commit_with_reviewed_pr / tot_commit_count;
  } catch (error) {
    if (error instanceof GraphqlResponseError) {
      globalThis.logger?.error(
        `%PR Factor: GraphQL call failed: ${error.message}`
      );
    } else {
      globalThis.logger?.error(
        `%PR Factor: GraphQL call failed for reason unknown: ${error}`
      );
    }
    return 0;
  }
}
