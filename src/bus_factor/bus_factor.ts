import {get_percent_owner} from './bus_factor_restapi';
import {get_number_forks} from './bus_factor_graphql';

export async function get_bus_factor_score(
  github_repo_url: string
): Promise<number> {
  const [percent_owner, number_forks] = await Promise.all([
    get_percent_owner(github_repo_url),
    get_number_forks(github_repo_url),
  ]);
  let score = 0;
  if (typeof percent_owner === 'number') {
    score += 0.75 * percent_owner;
  }
  globalThis.logger.info(`bus_factor percent_owner score ${score}`);
  if (typeof number_forks === 'number') {
    if (number_forks > 0) {
      score += 0.25 * (1 - 1 / number_forks);
    }
  }
  globalThis.logger.info(`bus_factor score ${score}`);
  return score;
}
