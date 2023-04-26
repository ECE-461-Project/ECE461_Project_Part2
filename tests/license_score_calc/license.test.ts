import {get_license_score} from '../../src/license_score_calc/license';

describe('testing get_license_score', () => {
  test('get_license_score invalid', async () => {
    expect(
      await get_license_score('url', './tests/_license_checks/extjs-gpl')
    ).toBe(0);
    //console.log(process.cwd());
  });
  test('get_license_score valid', async () => {
    expect(
      await get_license_score('url', './tests/_license_checks/license-checker')
    ).toBe(1);
    //console.log(process.cwd());
  });
  test('get_license_score valid from url', async () => {
    expect(
      await get_license_score('https://github.com/jashkenas/underscore', './tests/_license_checks/underscore_no_license_field')
    ).toBe(1);
    //console.log(process.cwd());
  });
  test('get_license_score unhandled', async () => {
    expect(
      await get_license_score('url', './tests/_license_checks/tweetnacl')
    ).toBe(0);
    //console.log(process.cwd());
  });
  test('get_license_score no license field', async () => {
    expect(
      await get_license_score('url', './tests/_license_checks/no_license_field')
    ).toBe(0);
    //console.log(process.cwd());
  });
  test('get_license_score not valid file', async () => {
    expect(
      await get_license_score('url', './tests/_license_checks/does-not-exist')
    ).toBe(0);
    //console.log(process.cwd());
  });
});
