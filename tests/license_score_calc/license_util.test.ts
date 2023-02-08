import {
  clone_and_install,
  check_licenses_result,
} from '../../src/license_score_calc/license_util';

//import * as path from 'path';
import * as sub_process_help from '../../src/sub_process_help';
const promisify = require('util.promisify-all');
const checker_orig = require('license-checker');
const checker = promisify(checker_orig);
import {create_logger} from '../../src/logging_setup';

create_logger();

describe('testing clone_and_install', () => {
  test('clone_and_install succeeds', async () => {
    jest.spyOn(sub_process_help, 'run_cmd').mockResolvedValue('stdout');
    expect(await clone_and_install('directory', 'url')).toBe(true);
  });
  test('clone_and_install fails first cmd', async () => {
    jest
      .spyOn(sub_process_help, 'run_cmd')
      .mockRejectedValue(new Error('First Error'));
    expect(await clone_and_install('directory', 'url')).toBe(false);
  });
  test('clone_and_install fails second cmd', async () => {
    jest
      .spyOn(sub_process_help, 'run_cmd')
      .mockRejectedValue(new Error('First Error'))
      .mockResolvedValueOnce('stdout');
    expect(await clone_and_install('directory', 'url')).toBe(false);
  });
});

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
