import {get_percent_owner} from '../../src/bus_factor/bus_factor_restapi';
import * as https from 'https';

import * as dotenv from 'dotenv';
import { request_aggregate } from '../../src/aggregate_request';
import { GitHubUrl_Info } from '../../src/url_parser';
dotenv.config();

describe('testing get_percent_owner', () => {
  const url: GitHubUrl_Info = {
    original: 'url',
    github_repo_url: 'https://github.com/octocat/hello-world',
    owner: 'jashkenas',
    repo: 'underscore',
  }
  const aggregate_request = request_aggregate(url);
  test('should return the percent of commits contributed by the owner', async () => {
    expect(
      !(await get_percent_owner('https://github.com/torvalds/linux', aggregate_request))
    ).toBeDefined();
  });
});
