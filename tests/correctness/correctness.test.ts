import { compute_correctness_score, get_correctness_score, GraphQl_Data } from '../../src/correctness/correctness';

describe('get_correctness_score', () => {
  it('should return a correctness score for a valid GitHub repository', async () => {
    const score = await get_correctness_score('https://github.com/octocat/hello-world');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe('GraphQl_data', () => {
    test('should return data for a valid GitHub repository URL', async () => {
      const repoUrl = 'https://github.com/octocat/Hello-World';
      const data = await GraphQl_Data(repoUrl);
      expect(data).toBeDefined();
      expect(data.repository.name).toBe('Hello-World');
    });

    test('should return undefined for an invalid GitHub repository URL', async () => {
      const repoUrl = 'https://github.com/cloudinary/repo';
      const data = await GraphQl_Data(repoUrl);
      expect(data.repository).toBeNull;
    });
  });