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
  let result: GraphQlQueryResponseData | undefined = undefined;
  result = undefined;
  try {
    const allContributions = await graphql({
      query: `query NewQuery($repo: String!, $owner: String!) {
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
    console.log(allContributions);
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
  }
  console.log(owner_repo);
  return 1;
}
