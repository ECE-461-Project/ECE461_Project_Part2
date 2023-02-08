import * as path from 'path';
import * as license_fs from '../../src/license_score_calc/license_fs';
import * as license_util from '../../src/license_score_calc/license_util';

import {get_license_score} from '../../src/license_score_calc/license';
import {create_logger} from '../../src/logging_setup';

create_logger();

describe('testing get_license_score', () => {
  jest.spyOn(license_fs, 'delete_dir').mockResolvedValue(undefined);
  test('no error valid', async () => {
    jest.spyOn(license_fs, 'create_tmp').mockResolvedValue('/tmp');
    jest.spyOn(license_util, 'clone_and_install').mockResolvedValue(true);
    jest.spyOn(license_util, 'check_licenses_result').mockResolvedValue(true);
    expect(await get_license_score('url')).toBe(1);
  });
  test('tmp dir failed', async () => {
    jest.spyOn(license_fs, 'create_tmp').mockResolvedValue('');
    jest.spyOn(license_util, 'clone_and_install').mockResolvedValue(true);
    jest.spyOn(license_util, 'check_licenses_result').mockResolvedValue(true);
    expect(await get_license_score('url')).toBe(0);
  });
  test('clone_and_install error', async () => {
    jest.spyOn(license_fs, 'create_tmp').mockResolvedValue('/tmp');
    jest.spyOn(license_util, 'clone_and_install').mockResolvedValue(false);
    jest.spyOn(license_util, 'check_licenses_result').mockResolvedValue(true);
    expect(await get_license_score('url')).toBe(0);
  });
  test('no error not valid', async () => {
    jest.spyOn(license_fs, 'create_tmp').mockResolvedValue('/tmp');
    jest.spyOn(license_util, 'clone_and_install').mockResolvedValue(true);
    jest.spyOn(license_util, 'check_licenses_result').mockResolvedValue(false);
    expect(await get_license_score('url')).toBe(0);
  });
});
