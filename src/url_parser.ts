import {createReadStream} from 'fs';
import {createInterface} from 'readline';

const getPackageGithubUrl = require('get-package-github-url');

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
): Promise<Promise<string>[] | undefined> {
  try {
    const unparsed_urls = await exports.read_file(filepath);
    if ('map' in unparsed_urls) {
      const urls = unparsed_urls.map(async (url: string) => {
        let repo_url = url;
        if (exports.check_if_npm(url)) {
          const package_name = exports.get_npm_package_name(url);
          if (package_name) {
            const val = await exports.get_github_url(package_name);
            if (val) {
              repo_url = val;
            } else {
              repo_url = '';
            }
          } else {
            return '';
          }
        }
        if (exports.check_if_github(repo_url)) {
          return repo_url;
        } else {
          return '';
        }
      });
      return urls;
    } else {
      return undefined;
    }
  } catch (err) {
    console.log(err);
  }
  return undefined;
}

export async function get_urls(filepath: string) {
  const data: Promise<string>[] | undefined = await exports._get_urls(filepath);
  const valid_urls: string[] = [];
  if (data) {
    for await (const url of data) {
      if (url) {
        console.log(url);
        valid_urls.push(url);
      } else {
        console.log('not valid url or github repo!');
      }
    }
    return valid_urls;
  } else {
    return [];
  }
}
