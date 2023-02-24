import {get_number_forks} from '../../src/bus_factor/bus_factor_graphql';
import * as https from 'https';

import * as dotenv from 'dotenv';
dotenv.config();

describe('testing get_number_forks', () => {
  test('should return a number if token is correct', async () => {
    expect(
      !(await get_number_forks('https://github.com/torvalds/linux'))
    ).toBeDefined();
  });
  test('should return undefined since not github', async () => {
    expect(await get_number_forks('https://github./torvalds/linux')).toBe(
      undefined
    );
  });
});
