import {create_logger} from './logging_setup';
import {get_scores_from_url} from './score_calculations';

async function main() {
  create_logger();
  const args = process.argv.slice(2);
  globalThis.logger?.debug(`main args: ${args}`);

  // All scores out at same time
  const score_list_resolved = await get_scores_from_url(process.argv[2]);
  // TODO: have main return the score list to populate database?
  console.log(score_list_resolved);
}

main();
