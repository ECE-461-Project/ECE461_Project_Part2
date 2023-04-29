import { request_aggregate } from '../../src/aggregate_request';
import { get_correctness_score} from '../../src/correctness/correctness';
import { GitHubUrl_Info } from '../../src/url_parser';

describe('get_correctness_score', () => {
  it('should return a correctness score for a valid GitHub repository', async () => {
    const url: GitHubUrl_Info = {
      original: 'url',
      github_repo_url: 'https://github.com/octocat/hello-world',
      owner: 'jashkenas',
      repo: 'underscore',
    }
    const aggregate_request = request_aggregate(url);
    const score = await get_correctness_score('https://github.com/octocat/hello-world', aggregate_request);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
