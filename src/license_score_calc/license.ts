import {readFile} from 'fs/promises';
import {join} from 'path';
import {parse_aggregate_promise} from '../aggregate_request';
import {GitHubUrl_Info} from '../url_parser';

// Example of using promise using async
// https://janelia-flyem.github.io/licenses.html
// https://en.wikipedia.org/wiki/ISC_license
// https://en.wikipedia.org/wiki/GNU_Lesser_General_Public_License#Differences_from_the_GPL
// Only allow the following licenses in module and dependencies:
//  MIT, Apache, ISC, WTFPL, BSD, BSD-Source-Code, CC0-1.0, Public Domain, LGPL-2.1-only, CC-BY-*
//  This uses SPDX Identifiers
// Does NOT handle custom or unlicenses modules. Defaults them to invalid for now.
export async function get_license_score(
  url_parse: GitHubUrl_Info,
  aggregate: any
): Promise<number> {
  try {
    const aggregate_data = await parse_aggregate_promise(aggregate);
    if (aggregate_data) {
      const package_json = aggregate_data.package_json;
      let license: string | undefined | null = package_json.license;
      globalThis.logger?.info(
        `${url_parse.github_repo_url} has license: ${license}`
      );

      const license_regex = new RegExp(
        'MIT|Apache|ISC|WTFPL|BSD|BSD-Source-Code|CC0-1.0|Public Domain|LGPL-2.1-only|CC-BY-*'
      );

      // Check package json
      if (license) {
        return license_regex.exec(license) ? 1 : 0;
      }
      // Check LICENSE file using github API
      const octokit = aggregate_data.octokit;
      const response = await octokit.rest.licenses.getForRepo({
        owner: url_parse.owner,
        repo: url_parse.repo,
      });
      license = response.data.license?.spdx_id;
      if (license) {
        return license_regex.exec(license) ? 1 : 0;
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.error(`License Score calc got error: ${err.message}`);
    } else {
      globalThis.logger?.error(`License Score calc got error: ${err}`);
    }
  }
  return 0;
}
