import {create_tmp, delete_dir} from './git_clone';
import {create_logger} from './logging_setup';
import {get_scores_from_url} from './score_calculations';
import {createReadStream} from 'fs';
import {createInterface} from 'readline';

//https://levelup.gitconnected.com/how-to-read-a-file-line-by-line-in-javascript-48d9a688fe49
export function read_file(
  filepath: string
): Promise<string[] | ReferenceError> {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filepath);
    const rl = createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    //errors from fs.createReadStream are caught in readline
    rl.on('error', (err: ReferenceError) => {
      reject(err);
    });
    const urls: string[] = [];
    rl.on('line', (line: string) => {
      urls.push(line);
    });
    rl.on('close', () => {
      resolve(urls);
    });
  });
}

async function main() {
  create_logger();
  const args = process.argv.slice(2);
  globalThis.logger?.debug(`main args: ${args}`);

  if (args.length === 1) {
    // eslint-disable-next-line prefer-const
    let urls: string[] = await exports.read_file(args[0]);
    for (const url of urls) {
      const tmp = await create_tmp();
      // All scores out at same time
      const score_list_resolved1 = await get_scores_from_url(url, tmp);
      delete_dir(tmp);
      console.log(score_list_resolved1);
    }
  } else if (args.length === 0) {
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
}

main();
