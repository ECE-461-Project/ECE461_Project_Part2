import {join} from 'path';

import {run_cmd} from '../sub_process_help';

const promisify = require('util.promisify-all');
// license-checker has no type file
const checker_orig = require('license-checker');
const checker = promisify(checker_orig);

export async function clone_and_install(
  tmp_dir: string,
  git_url: string
): Promise<boolean> {
  const git_folder_name = 'package';
  try {
    const git_out = await run_cmd('git', ['clone', git_url, git_folder_name], {
      cwd: tmp_dir,
    });
    globalThis.logger.debug(git_out);
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger.error(`Error while cloning: ${err.message}`);
    }
    return false;
  }
  try {
    const npm_out = await run_cmd('npm', ['install', '--omit=dev'], {
      cwd: join(tmp_dir, git_folder_name),
    });
    globalThis.logger.debug(npm_out);
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger.error(`Error while npm install: ${err.message}`);
    }
    return false;
  }
  return true;
}

// Example of using promise using async
// https://janelia-flyem.github.io/licenses.html
// https://en.wikipedia.org/wiki/ISC_license
// https://en.wikipedia.org/wiki/GNU_Lesser_General_Public_License#Differences_from_the_GPL
// Only allow the following licenses in module and dependencies:
//  MIT, Apache, ISC, WTFPL, BSD, BSD-Source-Code, CC0-1.0, Public Domain, LGPL-2.1-only, CC-BY-*
//  This uses SPDX Identifiers
// Does NOT handle custom or unlicenses modules. Defaults them to valid for now.
export async function check_licenses_result(
  path_to_check: string
): Promise<Boolean> {
  let is_valid = true;
  const options = {
    start: path_to_check,
    //failOn: 'hi;test',
    //json: true,
    direct: Infinity,
    color: false,
  };
  try {
    const licenses: Object = await checker.init(options);
    const license_regex = new RegExp(
      'MIT|Apache|ISC|WTFPL|BSD|BSD-Source-Code|CC0-1.0|Public Domain|LGPL-2.1-only|CC-BY-*'
    );
    const unhandled_regex = new RegExp('Custom|Unlicense|UNLICENSED');
    for (const [k, v] of Object.entries(licenses)) {
      if (license_regex.exec(v['licenses'])) {
        globalThis.logger.debug(`${k} has valid license: ${v['licenses']}`);
      } else if (unhandled_regex.exec(v['licenses'])) {
        globalThis.logger.debug(`${k} has unhandled license: ${v['licenses']}`);
      } else {
        globalThis.logger.debug(`${k} has invalid license: ${v['licenses']}`);
        is_valid = false;
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger.error(
        `Error while license checking: ${err.message}, stack: ${err.stack}`
      );
    }
    return false;
  }
  return is_valid;
}
