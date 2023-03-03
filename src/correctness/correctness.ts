//import { Octokit } from "octokit";
const fetch = require('node-fetch');
import {request} from 'https';

const secretKey: string | undefined = process.env.GITHUB_TOKEN;

if (!secretKey) {
  globalThis.logger?.error('GITHUB Token not defined');
  throw new Error('GITHUB_TOKEN is not defined');
}

async function GraphQl_Data(github_repo_url: string): Promise<any> {
  try {
    const reg = new RegExp('github\\.com/(.+)/(.+)');
    const matches = github_repo_url.match(reg);

    if (matches === null) {
      return undefined;
    }

    const query = `{
        repository(owner: "${matches[1]}", name: "${matches[2]}") {
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

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Token ${secretKey}`,
      },
      body: JSON.stringify({query: query}),
    });

    const result = (await response.json()).data;
    //const repository = result.repository;
    return result;
  } catch (error) {
    globalThis.logger?.error(`Correctness Score calc got error: ${error}`);
  }
  return null;
}

export function compute_correctness_score(data: any): number {
  const totalIssues =
    data.repository.openIssues.totalCount +
    data.repository.closedIssues.totalCount;
  const totalPullRequests = data.repository.pullRequests.totalCount;

  // Normalize the values for issues to range [0, 1]
  const normalizedOpenIssues =
    data.repository.openIssues.totalCount / totalIssues;
  const normalizedClosedIssues =
    data.repository.closedIssues.totalCount / totalIssues;

  // Normalize the values for pull requests to range [0, 1]
  //const normalizedPullRequests = data.repository.closedPullRequest.totalCount / totalPullRequests;
  const pullRequestCorrectness =
    data.repository.mergedPullRequests.totalCount /
    (data.repository.closedPullRequest.totalCount +
      data.repository.mergedPullRequests.totalCount); //totalPullRequests;

  globalThis.logger?.info(
    'MergedPullRequests = ' + data.repository.mergedPullRequests.totalCount
  );
  globalThis.logger?.info(
    'ClosedPullRequests = ' + data.repository.closedPullRequest.totalCount
  );

  const normalizedSecurityAdvisories =
    data.securityAdvisories.totalCount /
    (data.securityAdvisories.totalCount +
      data.repository.vulnerabilityAlerts.totalCount);
  const normalizedVulnerabilities =
    data.repository.vulnerabilityAlerts.totalCount /
    (data.securityVulnerabilities.totalCount +
      data.repository.vulnerabilityAlerts.totalCount);

  // Calculate the repository correctness score based on the normalized metrics
  const issueCorrectness =
    normalizedClosedIssues / (normalizedOpenIssues + normalizedClosedIssues);

  //const pullRequestCorrectness =  normalizedMergedPullRequests/normalizedPullRequests;

  const securityCorrectness =
    1 - normalizedSecurityAdvisories - normalizedVulnerabilities;

  //globalThis.logger?.info('pullRequest correctness = ' + pullRequestCorrectness);
  //globalThis.logger?.info('normalizedMergedPullRequests = ' + normalizedMergedPullRequests);
  //globalThis.logger?.info('normalizedPullRequests = ' + normalizedPullRequests);

  //globalThis.logger?.info('issue Correctness = ' + issueCorrectness);
  //globalThis.logger?.info('security correctness = ' + securityCorrectness);

  const temp_correctnessScore =
    0.4 * issueCorrectness +
    0.4 * pullRequestCorrectness +
    0.2 * securityCorrectness;

  const correctnessScore = Math.round(temp_correctnessScore * 100) / 100;

  return correctnessScore;
}

export async function get_correctness_score(
  local_repo_path: string
): Promise<number> {
  try {
    const data: any = await GraphQl_Data(local_repo_path);
    return compute_correctness_score(data);
  } catch (err) {
    globalThis.logger?.error(`RampUp Score calc got error: ${err}`);
  }
  return 0;
}
