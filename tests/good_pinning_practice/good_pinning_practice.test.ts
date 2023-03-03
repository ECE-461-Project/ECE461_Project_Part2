import {get_good_pinning_practice_score} from '../../src/good_pinning_practice_factor/good_pinning_practice';

describe('testing get_good_pinning_practice_score', () => {
  test('get_good_pinning_practice empty dependencies', async () => {
    expect(
      await get_good_pinning_practice_score('url', './tests/_good_pinning_practice_checks/_test_1_empty_dependencies')
    ).toBe(1);
  });
  test('get_good_pinning_practice no dependencies field', async () => {
    expect(
      await get_good_pinning_practice_score('url', './tests/_good_pinning_practice_checks/_test_2_no_dependencies_field')
    ).toBe(1);
  });
  test('get_good_pinning_practice no package.json present', async () => {
    expect(
      await get_good_pinning_practice_score('url', './tests/_good_pinning_practice_checks/_test_3_no_package_json')
    ).toBe(0);
  });
  test('get_good_pinning_practice lots of dependencies, none pinned', async () => {
    expect(
      await get_good_pinning_practice_score('url', './tests/_good_pinning_practice_checks/_test_4_no_pinned_dependencies')
    ).toBe(1);
  });
  test('get_good_pinning_practice lots of dependencies, one pinned', async () => {
    expect(
      await get_good_pinning_practice_score('url', './tests/_good_pinning_practice_checks/_test_5_one_pinned_dependency')
    ).toBe(0.5);
  });
});
