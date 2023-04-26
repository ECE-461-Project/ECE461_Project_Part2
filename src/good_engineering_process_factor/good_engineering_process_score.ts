import {fetch_score_with_graphql_data} from './good_engineering_process_graphql';

export async function get_good_engineering_process_score(
  repo_url: string
): Promise<number> {
  let perc: number | undefined = await fetch_score_with_graphql_data(repo_url);
  let score = 1;
  if (perc !== undefined) {
    globalThis.logger?.debug(
      `%PR metric calculation: Finished with PERCENTAGE score ${perc}\n`
    );
    perc = Number(perc.toFixed(3));
    globalThis.logger?.debug(
      `%PR metric calculation: ROUNDED PERCENTAGE score ${perc}\n`
    );
    if (perc >= 0.07) {
      globalThis.logger?.debug('%PR score 1');
      score = 1;
    } else if (perc >= 0.05) {
      score = 0.9;
    } else if (perc >= 0.04) {
      score = 0.8;
    } else if (perc >= 0.03) {
      score = 0.7;
    } else if (perc >= 0.02) {
      score = 0.6;
    } else if (perc >= 0.01) {
      score = 0.5;
    } else if (perc >= 0.005) {
      score = 0.4;
    } else if (perc >= 0.003) {
      score = 0.3;
    } else if (perc >= 0.002) {
      score = 0.2;
    } else if (perc >= 0.001) {
      score = 0.1;
    } else {
      score = 0;
    }
    return score;
  } else {
    globalThis.logger?.error(
      '%PR metric calculation undefined: Finished with score 0'
    );
    return 0;
  }
}
