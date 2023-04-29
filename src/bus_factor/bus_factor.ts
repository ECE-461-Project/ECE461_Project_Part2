import {get_percent_owner} from './bus_factor_restapi';
import {get_number_forks} from './bus_factor_graphql';
import {AggregateResponsePromise} from '../aggregate_request';

export async function get_bus_factor_score(
  url: string,
  aggregate_response: AggregateResponsePromise
): Promise<number> {
  const [percent_owner, number_forks] = await Promise.all([
    get_percent_owner(url, aggregate_response),
    get_number_forks(url, aggregate_response),
  ]);
  let score = 0;
  if (typeof percent_owner === 'number') {
    score += 0.4 * percent_owner;
  }
  globalThis.logger?.info(`bus_factor percent_owner score ${score}`);
  if (typeof number_forks === 'number') {
    if (number_forks > 0) {
      score += 0.6 * (1 - 1 / number_forks);
    }
  }
  globalThis.logger?.info(`bus_factor score ${score}`);
  return score;
}
