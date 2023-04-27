import {GitHubUrl_Info} from './url_parser';
import {graphql, GraphqlResponseError} from '@octokit/graphql';
import type {GraphQlQueryResponseData} from '@octokit/graphql';
import {GraphQlResponse} from '@octokit/graphql/dist-types/types';
import {Octokit} from '@octokit/rest';
import {git_clone} from './git_clone';
import {find_and_read_package_json} from './api_server/get_files';

export interface AggregateData {
  correctness_data: any;
  commits_list: any;
  repo_data: any;
  git_repo_path: string;
  package_json: any;
  octokit: Octokit;
}

async function correctness_data(
  url_parse: GitHubUrl_Info,
  secretKey: string
): Promise<GraphQlResponse<unknown>> {
  const query = `{
    repository(owner: "${url_parse.owner}", name: "${url_parse.repo}") {
      name
      stargazers {
        totalCount
      }
      issues(last: 100) {
        totalCount
        edges {
          node {
            createdAt
            updatedAt
            closedAt
          }
        }
      }
      pullRequests(last: 100) {
        totalCount
        edges {
          node {
            createdAt
            updatedAt
            closedAt
          }
        }
      }
      openPullRequest: pullRequests(states: OPEN) {
        totalCount
      }
      closedPullRequest: pullRequests(states: OPEN) {
        totalCount
      }
      openIssues: issues(states: OPEN) {
        totalCount
      }
      closedIssues: issues(states: CLOSED) {
        totalCount
      }
      mergedPullRequests: pullRequests(states: MERGED) {
        totalCount
      }
      defaultBranchRef {
        target {
          ... on Commit {
            history {
              totalCount
            }
            repository {
              milestones {
                totalCount
              }
              pullRequests(states: CLOSED) {
                totalCount
              }
            }
          }
        }
      }
      forks {
        totalCount
      }
      hasIssuesEnabled
      hasVulnerabilityAlertsEnabled
      watchers {
        totalCount
      }
      discussions {
        totalCount
      }
      releases {
        totalCount
      }
      updatedAt
      vulnerabilityAlerts {
        totalCount
      }
      watchers {
        totalCount
      }
    }
    securityAdvisories {
      totalCount
    }
    securityVulnerabilities(severities: HIGH) {
      totalCount
    }
  }`;
  const correctness_data = graphql({
    query: query,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'bearer ' + secretKey,
      'User-Agent': 'Node',
    },
  });
  return correctness_data;
}

async function commits_list(url_parse: GitHubUrl_Info, octokit: Octokit) {
  const commits_list = octokit.rest.repos.listCommits({
    owner: url_parse.owner,
    repo: url_parse.repo,
  });
  return commits_list;
}

async function repos(url_parse: GitHubUrl_Info, octokit: Octokit) {
  const response = octokit.rest.repos.get({
    owner: url_parse.owner,
    repo: url_parse.repo,
  });
  return response;
}

function git_clone_promise(
  temp_dir: string,
  url_parse: GitHubUrl_Info
): Promise<string> {
  return new Promise((resolve, reject) => {
    git_clone(temp_dir, url_parse.github_repo_url).then(clone_success => {
      if (clone_success) {
        resolve(temp_dir);
      } else {
        globalThis.logger?.error('Cloning repo failed!');
        reject(new Error('Cloning git repo failed'));
      }
    });
  });
}

async function package_json_promise(
  git_repo_path: Promise<string>
): Promise<string> {
  const git_path = await git_repo_path;
  return new Promise((resolve, reject) => {
    find_and_read_package_json(git_path).then(content => {
      if (content) {
        resolve(content);
      } else {
        reject(new Error('Could not find package.json'));
      }
    });
  });
}

export async function request_aggregate(
  temp_dir: string,
  url_parse: GitHubUrl_Info
) {
  const secretKey: string | undefined = process.env.GITHUB_TOKEN;

  if (!secretKey) {
    globalThis.logger?.error('GITHUB Token not defined');
    throw new Error('GITHUB_TOKEN is not defined');
  }
  const octokit = new Octokit({
    auth: secretKey,
    baseUrl: 'https://api.github.com',
  });

  const clone_promise = git_clone_promise(temp_dir, url_parse);
  const responses = Promise.all([
    correctness_data(url_parse, secretKey),
    commits_list(url_parse, octokit),
    repos(url_parse, octokit),
  ]);
  const clone_data = Promise.all([
    clone_promise,
    package_json_promise(clone_promise),
  ]);
  return [responses, clone_data, octokit];
}

export async function parse_aggregate_promise(aggregate_promise: any) {
  try {
    const aggregate_list = await aggregate_promise;
    const aggregate_response = await aggregate_list[0];
    const aggregate_clone_data = await aggregate_list[1];
    const octokit = await aggregate_list[2];
    const aggregate: AggregateData = {
      correctness_data: aggregate_response[0],
      commits_list: aggregate_response[1].data,
      repo_data: aggregate_response[2].data,
      git_repo_path: aggregate_clone_data[0],
      package_json: JSON.parse(aggregate_clone_data[1]),
      octokit: octokit,
    };
    return aggregate;
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.error(`Error in aggregate responses: ${err.message}`);
    } else {
      globalThis.logger?.error(`Error in aggregate responses: ${err}`);
    }
  }
  return undefined;
}
