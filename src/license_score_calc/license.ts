import {check_licenses_result} from './license_util';

export async function get_license_score(
  repo_url: string,
  local_repo_path: string
): Promise<number> {
  const is_valid = await check_licenses_result(local_repo_path);
  globalThis.logger.info(`license status for ${repo_url}: ${is_valid}`);

  const score = is_valid ? 1 : 0;

  return score;
}

//get_license_score().then((data: number) => {
//  console.log(data);
//});
