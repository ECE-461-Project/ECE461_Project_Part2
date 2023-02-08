import {createReadStream} from 'fs';
import {createInterface} from 'readline';

const getPackageGithubUrl = require('get-package-github-url');

export interface URL_PARSE {
  original_url: string;
  github_repo_url: string;
}

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

export function check_if_npm(url: string): boolean {
  const reg = new RegExp('npmjs\\.com/package/(?:[A-Za-z0-9_]*-*)+');
  return reg.test(url);
}

export function check_if_github(url: string): boolean {
  const reg = new RegExp(
    'github\\.com/(?:[A-Za-z0-9_]*-*)+/(?:[A-Za-z0-9_]*-*)+'
  );
  return reg.test(url);
}

export function get_npm_package_name(url: string): string {
  const reg = new RegExp('npmjs\\.com/package/((?:[A-Za-z0-9_]*-*)+)');
  const result = url.match(reg);
  if (result) {
    return result[1];
  } else {
    return '';
  }
}

export function get_github_url(package_name: string): Promise<string | null> {
  return getPackageGithubUrl(package_name);
}

export async function _get_urls(
  filepath: string
): Promise<Promise<URL_PARSE>[] | undefined> {
  try {
    const unparsed_urls = await exports.read_file(filepath);
    if ('map' in unparsed_urls) {
      const urls = unparsed_urls.map(async (url: string) => {
        const url_parse: URL_PARSE = {
          original_url: url,
          github_repo_url: '',
        };
        if (exports.check_if_npm(url)) {
          const package_name = exports.get_npm_package_name(url);
          if (package_name) {
            const potential_repo = await exports.get_github_url(package_name);
            if (potential_repo) {
              if (exports.check_if_github(potential_repo)) {
                url_parse.github_repo_url = potential_repo;
              }
            }
          }
        } else if (exports.check_if_github(url)) {
          url_parse.github_repo_url = url;
        }
        return url_parse;
      });
      return urls;
    } else {
      return undefined; // try-catch means can never be here
    }
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger.error(`_get_urls: ${err.message}, stack: ${err.stack}`);
    }
  }
  return undefined;
}

export async function get_urls(filepath: string): Promise<URL_PARSE[]> {
  const data: Promise<URL_PARSE>[] | undefined = await exports._get_urls(
    filepath
  );
  if (data) {
    const final_data: URL_PARSE[] = [];
    for await (const url_parse of data) {
      final_data.push(url_parse);
    }
    return final_data;
  } else {
    return [];
  }
}
