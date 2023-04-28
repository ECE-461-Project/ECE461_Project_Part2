import { request_aggregate } from '../../src/aggregate_request';
import {get_responsiveness_score} from '../../src/responsiveness_factor/responsiveness';

import * as dotenv from 'dotenv';
import { GitHubUrl_Info } from '../../src/url_parser';
dotenv.config();

describe('testing get_percent_owner', () => {
  test('should return a valid score', async () => {
    const url: GitHubUrl_Info = {
      original: 'url',
      github_repo_url: 'https://github.com/torvalds/linux',
      owner: 'torvalds',
      repo: 'linux',
    }
    const aggregate_request = request_aggregate(url);
    expect(
      await get_responsiveness_score('https://github.com/torvalds/linux', aggregate_request)
    ).toBeGreaterThanOrEqual(0);
  });
});
