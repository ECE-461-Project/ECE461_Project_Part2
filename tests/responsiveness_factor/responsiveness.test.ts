import {get_responsiveness_score} from '../../src/responsiveness_factor/responsiveness';

import * as dotenv from 'dotenv';
dotenv.config();

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
