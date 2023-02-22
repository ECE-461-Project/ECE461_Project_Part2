import {get_percent_owner} from '../../src/bus_factor/bus_factor_restapi';
import * as https from 'https';

import {create_logger} from '../../src/logging_setup';

process.env.LOG_LEVEL = '0';
process.env.LOG_FILE = 'log_file.txt';
import * as dotenv from 'dotenv';
dotenv.config();
create_logger();

describe('testing get_percent_owner', () => {
  test('should return the percent of commits contributed by the owner', async () => {
    expect(
      !(await get_percent_owner('https://github.com/torvalds/linux'))
    ).toBeDefined();
  });
  test('should return undefined since not github', async () => {
    expect(await get_percent_owner('https://github./torvalds/linux')).toBe(
      undefined
    );
  });
});
