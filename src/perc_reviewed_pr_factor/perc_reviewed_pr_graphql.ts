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

export async function fetch_graphql_data(
  github_repo_url: string
): Promise<number | undefined> {
  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error('GITHUB_TOKEN is not defined');
  }

  const owner_repo = get_owner_repo(github_repo_url);
  if (owner_repo === undefined) {
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
      console.log(tot_commit_count);
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
    let end_cursor = "";
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
      tot_pr_count = jdata.repository.pullRequests.totalCount;
      has_next_page = jdata.repository.pullRequests.pageInfo.hasNextPage;
      end_cursor = jdata.repository.pullRequests.pageInfo.endCursor;
      console.log(tot_pr_count);
      console.log(typeof has_next_page);
      console.log(has_next_page);
      console.log(typeof end_cursor);
      console.log(end_cursor);
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
  } catch (error) {
    if (error instanceof GraphqlResponseError) {
      globalThis.logger?.error(
        '%PR Factor: GraphQL call failed: ${error.message}'
      );
    } else {
      globalThis.logger?.error(
        '%PR Factor: GraphQL call failed for reason unknown!'
      );
    }
    return 0;
  }
  console.log(owner_repo);
  return 1;
}
