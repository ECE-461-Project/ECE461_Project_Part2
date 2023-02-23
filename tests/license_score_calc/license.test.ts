import {get_license_score} from '../../src/license_score_calc/license';
import {create_logger} from '../../src/logging_setup';

process.env.LOG_LEVEL = '0';
process.env.LOG_FILE = 'log_file.txt';
create_logger();

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
