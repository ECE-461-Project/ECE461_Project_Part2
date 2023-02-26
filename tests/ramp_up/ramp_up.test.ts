import {
  get_ramp_up_score,
  compute_ramp_up_score,
} from '../../src/ramp_up_factor/ramp_up';

describe('testing get_ramp_up_score', () => {
  test('get_license_score invalid', async () => {
    expect(await get_ramp_up_score('./tests/_ramp')).toBe(0);
  });
  test('get_license_score valid', async () => {
    expect(await get_ramp_up_score('./tests/_rampup_checks/_test_1')).toBe(1);
  });
});

describe('testing compute_ramp_up_score', () => {
  test('0 score', () => {
    expect(compute_ramp_up_score(0)).toBe(0);
  });
  test('0.2 score', () => {
    expect(compute_ramp_up_score(0.06)).toBe(0.2);
  });
  test('0.4 score', () => {
    expect(compute_ramp_up_score(0.11)).toBe(0.4);
  });
  test('0.6 score', () => {
    expect(compute_ramp_up_score(0.16)).toBe(0.6);
  });
  test('0.8 score', () => {
    expect(compute_ramp_up_score(0.21)).toBe(0.8);
  });
  test('1 score', () => {
    expect(compute_ramp_up_score(0.26)).toBe(1);
  });
});
