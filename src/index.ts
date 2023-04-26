import {create_tmp, delete_dir} from './git_clone';
import {create_logger} from './logging_setup';
import {get_scores_from_url} from './score_calculations';

async function main() {
  create_logger();
  const args = process.argv.slice(2);
  globalThis.logger?.debug(`main args: ${args}`);

  let temp_dir = await create_tmp();
  // All scores out at same time
  let score_list_resolved = await get_scores_from_url(
    'https://github.com/jashkenas/underscore',
    temp_dir
  );
  delete_dir(temp_dir);
  console.log(score_list_resolved);

  temp_dir = await create_tmp();
  // All scores out at same time
  score_list_resolved = await get_scores_from_url(
    'https://github.com/cloudinary/cloudinary_npm',
    temp_dir
  );
  delete_dir(temp_dir);
  console.log(score_list_resolved);

  temp_dir = await create_tmp();
  // All scores out at same time
  score_list_resolved = await get_scores_from_url(
    'https://www.npmjs.com/package/express',
    temp_dir
  );
  delete_dir(temp_dir);

  console.log(score_list_resolved);

  temp_dir = await create_tmp();
  // All scores out at same time
  score_list_resolved = await get_scores_from_url(
    'https://github.com/nullivex/nodist',
    temp_dir
  );
  delete_dir(temp_dir);

  console.log(score_list_resolved);

  temp_dir = await create_tmp();
  // All scores out at same time
  score_list_resolved = await get_scores_from_url(
    'https://github.com/lodash/lodash',
    temp_dir
  );
  delete_dir(temp_dir);

  console.log(score_list_resolved);

  temp_dir = await create_tmp();
  // All scores out at same time
  score_list_resolved = await get_scores_from_url(
    'https://www.npmjs.com/package/browserify',
    temp_dir
  );
  delete_dir(temp_dir);

  console.log(score_list_resolved);

  temp_dir = await create_tmp();
  // All scores out at same time
  score_list_resolved = await get_scores_from_url(
    'https://github.com/jashkenas/underscore',
    temp_dir
  );
  delete_dir(temp_dir);

  console.log(score_list_resolved);
}

main();
