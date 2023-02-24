import {readFile} from 'fs/promises';
import {join} from 'path';

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
    const license: string | undefined = package_json.license;
    globalThis.logger?.info(`${repo_url} has license: ${license}`);

    const license_regex = new RegExp(
      'MIT|Apache|ISC|WTFPL|BSD|BSD-Source-Code|CC0-1.0|Public Domain|LGPL-2.1-only|CC-BY-*'
    );
    if (license) {
      return license_regex.exec(license) ? 1 : 0;
    } else {
      return 0;
    }
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.error(`License Score calc got error: ${err.message}`);
    }
  }
  return 0;
}
