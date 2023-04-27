import {get_license_score} from './license_score_calc/license';
import {get_bus_factor_score} from './bus_factor/bus_factor';
import {get_responsiveness_score} from './responsiveness_factor/responsiveness';
import {git_clone, create_tmp, delete_dir} from './git_clone';
import {join} from 'path';
import {get_ramp_up_score} from './ramp_up_factor/ramp_up';
import {get_correctness_score} from './correctness/correctness';
import {get_good_pinning_practice_score} from './good_pinning_practice_factor/good_pinning_practice';
import {get_good_engineering_process_score} from './good_engineering_process_factor/good_engineering_process_score';
import {GitHubUrl_Info, get_url_parse_from_input} from './url_parser';

import {PackageRating} from './api_server/models/models';
import {file_aggregate, request_aggregate} from './aggregate_request';

export interface SCORE_OUT {
  URL: string;
  GitHubLink: string;
  Rating: PackageRating;
}

//get_license_score('git@github.com:davglass/license-checker.git').then(
//  (data: number) => {
//    console.log(data);
//  }
//);

function net_score_formula(subscores: SCORE_OUT): number {
  // prettier-ignore
  // include 2 new metrics for Part 2
  const net_score: number =
  subscores.Rating.LicenseScore * (
    (subscores.Rating.RampUp * 0.3) +
    (subscores.Rating.BusFactor * 0.3) +
    (subscores.Rating.ResponsiveMaintainer * 0.05) +
    (subscores.Rating.Correctness * 0.2) +
    (subscores.Rating.GoodPinningPractice * 0.1) +
    (subscores.Rating.PullRequest * 0.05)
  );
  return net_score;
}

export async function score_calc(url_parse: GitHubUrl_Info, temp_dir: string) {
  const score: SCORE_OUT = {
    URL: url_parse.original,
    GitHubLink: url_parse.github_repo_url,
    Rating: {
      NetScore: 0,
      RampUp: 0,
      Correctness: 0,
      BusFactor: 0,
      ResponsiveMaintainer: 0,
      LicenseScore: 0,
      GoodPinningPractice: 0,
      PullRequest: 0,
    },
  };
  try {
    const aggregateRequest = request_aggregate(url_parse);
    const aggregateFile = file_aggregate(temp_dir, url_parse);

    // Get promises to subscores
    const subscores = await Promise.all([
      get_license_score(url_parse, aggregateFile, aggregateRequest),
      get_bus_factor_score(url_parse.github_repo_url, aggregateRequest),
      get_responsiveness_score(url_parse.github_repo_url, aggregateRequest),
      get_ramp_up_score(url_parse.github_repo_url, aggregateFile),
      get_correctness_score(url_parse.github_repo_url, aggregateRequest),
      get_good_pinning_practice_score(url_parse.github_repo_url, aggregateFile),
      get_good_engineering_process_score(url_parse.github_repo_url),
    ]);
    // Resolve subscores
    score.Rating.LicenseScore = subscores[0];
    score.Rating.BusFactor = Number(subscores[1].toFixed(3));
    score.Rating.ResponsiveMaintainer = Number(subscores[2].toFixed(2));
    score.Rating.RampUp = Number(subscores[3].toFixed(3));
    score.Rating.Correctness = Number(subscores[4].toFixed(3));
    score.Rating.GoodPinningPractice = Number(subscores[5].toFixed(3));
    score.Rating.PullRequest = Number(subscores[6].toFixed(3));

    // Calculate subscores
    score.Rating.NetScore = Number(net_score_formula(score).toFixed(3));
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
    // delete_dir(temp_dir);
  }
  globalThis.logger?.debug(
    `Score for ${url_parse.github_repo_url}: ${JSON.stringify(score.Rating)}`
  );
  return score;
}

export async function get_scores_from_url(
  urlval: string,
  temp_dir: string
): Promise<SCORE_OUT> {
  const url = await get_url_parse_from_input(urlval);
  if (url === undefined) {
    throw new Error('Undefined URL input!');
  }
  globalThis.logger?.debug(`url: ${url.github_repo_url} `);

  // Each url score computed one by one -> slow!
  const score_list: Promise<SCORE_OUT> = score_calc(url, temp_dir);
  return score_list;
}
