import {readFile} from 'fs/promises';
import {join} from 'path';
const fetch = require('node-fetch');

// Example of using promise using async
// https://janelia-flyem.github.io/licenses.html
// https://en.wikipedia.org/wiki/ISC_license
// https://en.wikipedia.org/wiki/GNU_Lesser_General_Public_License#Differences_from_the_GPL
// Only allow the following licenses in module and dependencies:
//  MIT, Apache, ISC, WTFPL, BSD, BSD-Source-Code, CC0-1.0, Public Domain, LGPL-2.1-only, CC-BY-*
//  This uses SPDX Identifiers
// Does NOT handle custom or unlicenses modules. Defaults them to invalid for now.
export async function get_license_score(
  repo_url: string,
  local_repo_path: string
): Promise<number> {
  try {
    const package_json = JSON.parse(
      (await readFile(join(local_repo_path, 'package.json'))).toString()
    );
    let license: string | undefined = package_json.license;
    globalThis.logger?.info(`${repo_url} has license: ${license}`);

    const license_regex = new RegExp(
      'MIT|Apache|ISC|WTFPL|BSD|BSD-Source-Code|CC0-1.0|Public Domain|LGPL-2.1-only|CC-BY-*'
    );

    // Check package json
    if (license) {
      return license_regex.exec(license) ? 1 : 0;
    }
    // Check LICENSE file using github API
    const reg = new RegExp('github\\.com/(.+)/(.+)');
    const matches = repo_url.match(reg);
    if (matches === null) {
      return 0;
    }
    if (process.env.GITHUB_TOKEN === undefined) {
      throw new Error('GITHUB_TOKEN is not defined');
    }
    const licenseAdr = `https://api.github.com/repos/${matches[1]}/${matches[2]}/license`;
    const response = await fetch(licenseAdr, {
      method: 'GET',
      headers: {
        Authorization: `Token ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    });
    license = (await response.json()).license.spdx_id;
    if (license) {
      return license_regex.exec(license) ? 1 : 0;
    }
    return 0;
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.error(`License Score calc got error: ${err.message}`);
    } else {
      globalThis.logger?.error(`License Score calc got error: ${err}`);
    }
  }
  return 0;
}
