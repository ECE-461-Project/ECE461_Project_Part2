import {get_responsiveness_score} from '../../src/responsiveness_factor/responsiveness';

import {create_logger} from '../../src/logging_setup';

process.env.LOG_LEVEL = '0';
process.env.LOG_FILE = 'log_file.txt';
import * as dotenv from 'dotenv';
dotenv.config();
create_logger();

describe('testing get_percent_owner', () => {
  test('should return a valid score', async () => {
    expect(
      await get_responsiveness_score('https://github.com/torvalds/linux')
    ).toBeGreaterThanOrEqual(0);
  });
  test('should return 0 since not github', async () => {
    expect(
      await get_responsiveness_score('https://github./torvalds/linux')
    ).toBe(0);
  });
});
