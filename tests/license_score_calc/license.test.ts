import {get_license_score} from '../../src/license_score_calc/license';
import { GitHubUrl_Info } from '../../src/url_parser';
import { AggregateFilePromise, AggregateResponsePromise, request_aggregate } from '../../src/aggregate_request';
import { readFileSync } from 'fs';

describe('testing get_license_score', () => {
  const url: GitHubUrl_Info = {
    original: 'url',
    github_repo_url: 'https://github.com/jashkenas/underscore',
    owner: 'jashkenas',
    repo: 'underscore',
  }
  const get_aggregate_file = (path: string) => {
    const file_promise: AggregateFilePromise = {
      git_repo_path: new Promise((resolve) => {resolve('a')}),
      package_json: JSON.parse(readFileSync(`${path}/package.json`).toString()),
    };
    return file_promise;
  }
  const aggregate_request = request_aggregate(url);
  test('get_license_score invalid', async () => {
    expect(
      await get_license_score(url, get_aggregate_file('./tests/_license_checks/extjs-gpl'), aggregate_request)
    ).toBe(0);
    //console.log(process.cwd());
  });
  test('get_license_score valid', async () => {
    expect(
      await get_license_score(url, get_aggregate_file('./tests/_license_checks/license-checker'), aggregate_request)
    ).toBe(1);
    //console.log(process.cwd());
  });
  test('get_license_score valid from url', async () => {
    expect(
      await get_license_score(url, get_aggregate_file('./tests/_license_checks/underscore_no_license_field'), aggregate_request)
    ).toBe(1);
    //console.log(process.cwd());
  });
  test('get_license_score unhandled', async () => {
    expect(
      await get_license_score(url, get_aggregate_file('./tests/_license_checks/tweetnacl'), aggregate_request)
    ).toBe(0);
    //console.log(process.cwd());
  });
  test('get_license_score not valid file', async () => {
    const file_promise: AggregateFilePromise = {
      git_repo_path: new Promise((resolve) => {resolve('a')}),
      package_json: new Promise((reject) => {reject(new Error('Fake no file'))}),
    };
    expect(
      await get_license_score(url, file_promise, aggregate_request)
    ).toBe(1);
    //console.log(process.cwd());
  });
});
