import * as license_util from '../../src/license_score_calc/license_util';

import {get_license_score} from '../../src/license_score_calc/license';
import {create_logger} from '../../src/logging_setup';

process.env.LOG_LEVEL = '0';
process.env.LOG_FILE = 'log_file.txt';
create_logger();

describe('testing get_license_score', () => {
  test('no error valid', async () => {
    jest.spyOn(license_util, 'check_licenses_result').mockResolvedValue(true);
    expect(await get_license_score('url', 'path')).toBe(1);
  });
  test('no error not valid', async () => {
    jest.spyOn(license_util, 'check_licenses_result').mockResolvedValue(false);
    expect(await get_license_score('url', 'path')).toBe(0);
  });
});
