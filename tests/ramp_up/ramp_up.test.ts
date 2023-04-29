import { AggregateFilePromise } from '../../src/aggregate_request';
import {
  get_ramp_up_score,
  compute_ramp_up_score,
} from '../../src/ramp_up_factor/ramp_up';

describe('testing get_ramp_up_score', () => {
  test('get_ramp_up_score valid', async () => {
    const file_promise: AggregateFilePromise = {
      git_repo_path: new Promise((resolve) => {resolve('./tests/_rampup_checks/_test_1')}),
      package_json: new Promise((resolve) => {resolve('a')}),
    };
    expect(await get_ramp_up_score('url', file_promise)).toBe(1);
  });
  test('get_ramp_up_score invalid', async () => {
    const a = 2;
    const file_promise: AggregateFilePromise = {
      git_repo_path: new Promise((resolve, reject) => {
        if (a == 2) {
        reject(new Error('hi'))
      }
    }),
      package_json: new Promise((resolve) => {resolve('a')}),
    };
    expect(await get_ramp_up_score('url', file_promise)).toBe(0);
  });
});

describe('testing compute_ramp_up_score', () => {
  test('0 score', () => {
    expect(compute_ramp_up_score(0)).toBe(0);
  });
  test('0.2 score', () => {
    expect(compute_ramp_up_score(0.04)).toBe(0.2);
  });
  test('0.4 score', () => {
    expect(compute_ramp_up_score(0.07)).toBe(0.4);
  });
  test('0.6 score', () => {
    expect(compute_ramp_up_score(0.10)).toBe(0.6);
  });
  test('0.8 score', () => {
    expect(compute_ramp_up_score(0.13)).toBe(0.8);
  });
  test('1 score', () => {
    expect(compute_ramp_up_score(0.16)).toBe(1);
  });
});
