import {create_tmp} from './git_clone';
import {create_logger} from './logging_setup';
import {get_scores_from_url} from './score_calculations';

async function main() {
  create_logger();
  const args = process.argv.slice(2);
  globalThis.logger?.debug(`main args: ${args}`);
  const temp_dir = await create_tmp();

  // All scores out at same time
  const score_list_resolved = await get_scores_from_url(
    process.argv[2],
    temp_dir
  );
  console.log(score_list_resolved);
}

main();
