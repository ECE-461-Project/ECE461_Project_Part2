import {get_number_forks} from '../../src/bus_factor/bus_factor_graphql';
import * as https from 'https';

import * as dotenv from 'dotenv';
import { GitHubUrl_Info } from '../../src/url_parser';
import { request_aggregate } from '../../src/aggregate_request';
dotenv.config();

describe('testing get_number_forks', () => {
  const url: GitHubUrl_Info = {
    original: 'url',
    github_repo_url: 'https://github.com/octocat/hello-world',
    owner: 'jashkenas',
    repo: 'underscore',
  }
  const aggregate_request = request_aggregate(url);
  test('should return a number if token is correct', async () => {
    expect(
      !(await get_number_forks('https://github.com/torvalds/linux', aggregate_request))
    ).toBeDefined();
  });
});
