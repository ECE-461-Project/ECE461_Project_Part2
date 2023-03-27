import {fetch_score_with_graphql_data} from '../../src/good_engineering_process_factor/good_engineering_process_graphql'

describe('testing fetch_score_with_graphql_data', () => {
  jest.setTimeout(15000);
  test('should return the percent of commits pushed with PR and review - no pagination', async () => {
    expect(
      !(await fetch_score_with_graphql_data('https://github.com/torvalds/linux'))
    ).toBeDefined();
  });
  
  test('should return the percent of commits pushed with PR and review - with pagination', async () => {
    expect(
      !(await fetch_score_with_graphql_data('https://github.com/cloudinary/cloudinary_npm'))
    ).toBeDefined();
  });
  
  test('should return undefined since not github', async () => {
    expect(await fetch_score_with_graphql_data('https://github./torvalds/linux')).toBe(
      undefined
    );
  });
  
  test('should return 0 graphql error', async () => {
    expect(await fetch_score_with_graphql_data('https://github.com/cloudinary/cloudinary')).toBe(
      0
    );
  });
});
