import {fetch_graphql_data} from './perc_reviewed_pr_graphql';

export async function get_perc_reviewed_pr_score(
  repo_url: string
): Promise<number> {
  const score = 0;
  console.log(repo_url);
  let tmp: number | undefined = 0;
  tmp = await fetch_graphql_data(repo_url);
  console.log(tmp);
  console.log(score);
  return 0;
}
