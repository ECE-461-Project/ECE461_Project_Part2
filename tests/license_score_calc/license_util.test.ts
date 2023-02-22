import {check_licenses_result} from '../../src/license_score_calc/license_util';

//import * as path from 'path';
const promisify = require('util.promisify-all');
const checker_orig = require('license-checker');
const checker = promisify(checker_orig);
import {create_logger} from '../../src/logging_setup';

process.env.LOG_LEVEL = '0';
process.env.LOG_FILE = 'log_file.txt';
create_logger();

describe('testing check_licenses_results', () => {
  test('check_licenses_result error', async () => {
    jest.spyOn(checker, 'init').mockRejectedValue(new Error('Fake Error'));
    expect(await check_licenses_result('path')).toBe(false);
  });
  test('check_licenses_result invalid', async () => {
    expect(
      await check_licenses_result('./tests/_license_checks/extjs-gpl')
    ).toBe(false);
    //console.log(process.cwd());
  });
  test('check_licenses_result valid', async () => {
    expect(
      await check_licenses_result('./tests/_license_checks/license-checker')
    ).toBe(true);
    //console.log(process.cwd());
  });
  test('check_licenses_result unhandled', async () => {
    expect(
      await check_licenses_result('./tests/_license_checks/tweetnacl')
    ).toBe(true);
    //console.log(process.cwd());
  });
});
