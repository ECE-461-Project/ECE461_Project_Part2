import {fetch_score_with_graphql_data} from './good_engineering_process_graphql';

export async function get_good_engineering_process_score(
  repo_url: string
): Promise<number> {
  const score: number | undefined = await fetch_score_with_graphql_data(
    repo_url
  );
  if (score !== undefined) {
    globalThis.logger.info(
      `%PR metric calculation: Finished with score ${score}\n`
    );
    return score;
  } else {
    globalThis.logger.info(
      '%PR metric calculation undefined: Finished with score 0'
    );
    return 0;
  }
}
