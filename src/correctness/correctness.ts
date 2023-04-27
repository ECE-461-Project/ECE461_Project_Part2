import {parse_aggregate_promise} from '../aggregate_request';

export function compute_correctness_score(data: any): number {
  const totalIssues =
    data.repository.openIssues.totalCount +
    data.repository.closedIssues.totalCount;

  // Normalize the values for issues to range [0, 1]
  const normalizedOpenIssues =
    data.repository.openIssues.totalCount / totalIssues;
  const normalizedClosedIssues =
    data.repository.closedIssues.totalCount / totalIssues;

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

  const issueCorrectness =
    normalizedClosedIssues / (normalizedOpenIssues + normalizedClosedIssues);

  const securityCorrectness =
    1 - normalizedSecurityAdvisories - normalizedVulnerabilities;

  const temp_correctnessScore =
    0.4 * issueCorrectness +
    0.4 * pullRequestCorrectness +
    0.2 * securityCorrectness;

  const correctnessScore = Math.round(temp_correctnessScore * 100) / 100;

  return correctnessScore;
}

export async function get_correctness_score(aggregate: any): Promise<number> {
  const aggregate_data = await parse_aggregate_promise(aggregate);
  if (aggregate_data) {
    return compute_correctness_score(aggregate_data.correctness_data);
  } else {
    return 0;
  }
}
