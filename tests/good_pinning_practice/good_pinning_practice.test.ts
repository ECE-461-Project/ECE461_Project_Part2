import { readFileSync } from 'fs';
import { AggregateFilePromise } from '../../src/aggregate_request';
import {get_good_pinning_practice_score, check_if_pinned} from '../../src/good_pinning_practice_factor/good_pinning_practice';

describe('testing get_good_pinning_practice_score', () => {
  const get_aggregate_file = (path: string) => {
    const file_promise: AggregateFilePromise = {
      git_repo_path: new Promise((resolve) => {resolve('a')}),
      package_json: JSON.parse(readFileSync(`${path}/package.json`).toString()),
    };
    return file_promise;
  }
  test('get_good_pinning_practice empty dependencies', async () => {
    expect(
      await get_good_pinning_practice_score('url', get_aggregate_file('./tests/_good_pinning_practice_checks/_test_1_empty_dependencies'))
    ).toBe(1);
  });
  test('get_good_pinning_practice no dependencies field', async () => {
    expect(
      await get_good_pinning_practice_score('url', get_aggregate_file('./tests/_good_pinning_practice_checks/_test_2_no_dependencies_field'))
    ).toBe(1);
  });
  test('get_good_pinning_practice no package.json present', async () => {
    const file_promise: AggregateFilePromise = {
      git_repo_path: new Promise((resolve) => {resolve('a')}),
      package_json: new Promise((reject) => {throw (new Error('no package.json'))}),
    };
    expect(
      await get_good_pinning_practice_score('url', file_promise)
    ).toBe(0);
  });
  test('get_good_pinning_practice lots of dependencies, none pinned', async () => {
    expect(
      await get_good_pinning_practice_score('url', get_aggregate_file('./tests/_good_pinning_practice_checks/_test_4_no_pinned_dependencies'))
    ).toBe(0);
  });
  test('get_good_pinning_practice lots of dependencies, one pinned', async () => {
    expect(
      await get_good_pinning_practice_score('url', get_aggregate_file('./tests/_good_pinning_practice_checks/_test_5_one_pinned_dependency'))
    ).toBeCloseTo(0.1666);
  });
});

describe('testing check_if_pinned regex', () => {
  test('check_if_pinned valid', async () => {
    expect(
      check_if_pinned("1.3.1")
    ).toBe(true);
  });
  // this one may need to be true if patch isn't needed ... check  regex
  test('check_if_pinned invalid not specified patch (need 2.3.X 3 digit)', async () => {
    expect(
      check_if_pinned("1.3")
    ).toBe(false);
  });
  test('check_if_pinned named meta', async () => {
    expect(
      check_if_pinned("1.1.2+meta")
    ).toBe(true);
  });
  test('check_if_pinned invalid ranging', async () => {
    expect(
      check_if_pinned("1.2.7 || >=1.2.9 <2.0.0")
    ).toBe(false);
  });
  // Add more if tilde or 1.2.x is valid -discuss
});
