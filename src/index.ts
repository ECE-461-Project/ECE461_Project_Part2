import {get_license_score} from './license_score_calc/license';
import {get_urls, URL_PARSE} from './url_parser';
import {create_logger} from './logging_setup';
import {get_bus_factor_score} from './bus_factor/bus_factor';
import {get_responsiveness_score} from './responsiveness_factor/responsiveness';
import {git_clone, create_tmp, delete_dir} from './git_clone';
import {join} from 'path';
import {get_ramp_up_score} from './ramp_up_factor/ramp_up';
import {get_correctness_score} from './correctness/correctness';
import {get_good_pinning_practice_score} from './good_pinning_practice_factor/good_pinning_practice';

const arrayToNdjson = require('array-to-ndjson');

interface SCORE_OUT {
  URL: string;
  NetScore: number;
  RampUp: number;
  Correctness: number;
  BusFactor: number;
  ResponsiveMaintainer: number;
  License: number;
  GoodPinningPractice: number;
}

//get_license_score('git@github.com:davglass/license-checker.git').then(
//  (data: number) => {
//    console.log(data);
//  }
//);

function net_score_formula(subscores: SCORE_OUT): number {
  // prettier-ignore
  // Temp fix to include ramp up in net score calc
  const net_score: number =
  subscores.License * (
    (subscores.RampUp * 0.3) +
    (subscores.BusFactor * 0.3) +
    (subscores.ResponsiveMaintainer * 0.2) +
    (subscores.Correctness * 0.2)
  );
  return net_score;
}

async function score_calc(url_parse: URL_PARSE) {
  const score: SCORE_OUT = {
    URL: url_parse.original_url, // SHOULD THIS BE ORIGINAL?
    NetScore: 0,
    RampUp: 0,
    Correctness: 0,
    BusFactor: 0,
    ResponsiveMaintainer: 0,
    License: 0,
    GoodPinningPractice: 0,
  };
  let temp_dir = '';
  try {
    // Create Temporary Directory
    temp_dir = await create_tmp();
    // Clone git repository into temp dir
    const clone_successful = await git_clone(
      temp_dir,
      url_parse.github_repo_url
    );
    // Throw if cloning fails
    if (!clone_successful) {
      globalThis.logger?.error('Cloning repo failed!');
      throw new Error('Cloning git repo failed');
    }
    // Path to git repository in temp directory
    const git_repo_path = join(temp_dir, 'package');

    // Get promises to subscores
    const license_sub_score = get_license_score(
      url_parse.github_repo_url,
      git_repo_path
    );
    const bus_factor_sub_score = get_bus_factor_score(
      url_parse.github_repo_url
    );
    const responsiveness_sub_score = get_responsiveness_score(
      url_parse.github_repo_url
    );

    const ramp_up_sub_score = get_ramp_up_score(git_repo_path);

    const correctness_sub_score = get_correctness_score(
      url_parse.github_repo_url
    );

    const good_pinning_practice_sub_score = get_good_pinning_practice_score(
      url_parse.github_repo_url,
      git_repo_path
    );

    // Resolve subscores
    score.License = await license_sub_score;
    score.BusFactor = Number((await bus_factor_sub_score).toFixed(3));
    score.ResponsiveMaintainer = Number(
      (await responsiveness_sub_score).toFixed(2)
    );
    score.RampUp = Number((await ramp_up_sub_score).toFixed(3));
    score.Correctness = Number((await correctness_sub_score).toFixed(3));
    score.GoodPinningPractice = Number(
      (await good_pinning_practice_sub_score).toFixed(3)
    );

    // Calculate subscores
    score.NetScore = Number(net_score_formula(score).toFixed(3));
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Temporary Directory Creation failed') {
        // Do nothing already logged
      } else if (err.message === 'Cloning git repo failed') {
        // Do nothing already logged
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  } finally {
    // Cleanup temporary directory
    delete_dir(temp_dir);
  }
  return score;
}

async function main() {
  create_logger();
  const args = process.argv.slice(2);
  globalThis.logger?.debug(`main args: ${args}`);

  const urls = await get_urls(args[0]);

  // Each url score computed one by one -> slow!
  const score_list: Promise<SCORE_OUT>[] = urls.map(score_calc);

  // All scores out at same time
  arrayToNdjson(await Promise.all(score_list)).pipe(process.stdout);
}

main();
