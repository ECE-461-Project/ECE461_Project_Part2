import {get_license_score} from './license_score_calc/license';
import {get_urls, URL_PARSE} from './url_parser';
import {create_logger} from './logging_setup';
import {get_bus_factor_score} from './bus_factor/bus_factor';
import {get_responsiveness_score} from './responsiveness_factor/responsiveness';
import {git_clone, create_tmp, delete_dir} from 'git_clone';
import {join} from 'path';

const arrayToNdjson = require('array-to-ndjson');

interface SCORE_OUT {
  URL: string;
  NetScore: number;
  RampUp: number;
  Correctness: number;
  BusFactor: number;
  ResponsiveMaintainer: number;
  License: number;
}

//get_license_score('git@github.com:davglass/license-checker.git').then(
//  (data: number) => {
//    console.log(data);
//  }
//);

function net_score_formula(subscores: SCORE_OUT): number {
  // prettier-ignore
  const net_score: number =
  subscores.License * (
    (subscores.RampUp) +
    (subscores.Correctness) +
    (subscores.BusFactor * 0.6) +
    (subscores.ResponsiveMaintainer * 0.4)
  );
  return net_score;
}

async function main() {
  create_logger();
  const args = process.argv.slice(2);
  globalThis.logger.debug(`main args: ${args}`);

  const urls = await get_urls(args[0]);

  // Each url score computed one by one -> slow!
  const score_list: Promise<SCORE_OUT>[] = urls.map(
    async (url_parse: URL_PARSE) => {
      const score: SCORE_OUT = {
        URL: url_parse.original_url, // SHOULD THIS BE ORIGINAL?
        NetScore: 0,
        RampUp: 0,
        Correctness: 0,
        BusFactor: 0,
        ResponsiveMaintainer: 0,
        License: 0,
      };
      let temp_dir = '';
      try {
        temp_dir = await create_tmp();
        const clone_successful = await git_clone(
          temp_dir,
          url_parse.github_repo_url
        );
        let license_sub_score: Promise<number>;
        if (clone_successful) {
          const git_repo_path = join(temp_dir, 'package');
          license_sub_score = get_license_score(
            url_parse.github_repo_url,
            git_repo_path
          );
        } else {
          globalThis.logger.error(
            'Cloning repo failed, subscores dependent on local repo resolved to 0!'
          );
          license_sub_score = new Promise(resolve => {
            resolve(0);
          });
        }
        const bus_factor_sub_score = get_bus_factor_score(
          url_parse.github_repo_url
        );
        const responsiveness_sub_score = get_responsiveness_score(
          url_parse.github_repo_url
        );

        score.License = await license_sub_score;
        score.BusFactor = Number((await bus_factor_sub_score).toFixed(3));
        score.ResponsiveMaintainer = Number(
          (await responsiveness_sub_score).toFixed(2)
        );
        score.NetScore = net_score_formula(score);
        delete_dir(temp_dir);
        return score;
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === 'Temporary Directory Creation failed') {
            // Do nothing already logged
          } else {
            throw err;
          }
        }
      }
      return score;
    }
  );

  // All scores out at same time
  arrayToNdjson(await Promise.all(score_list)).pipe(process.stdout);
}

main();
