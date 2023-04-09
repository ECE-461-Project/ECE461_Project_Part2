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

export interface OwnerAndRepo {
  url: string;
  owner: string;
  repo: string;
  cloning_url: string;
}

function fix_github_url(git_url: string): string {
  const url_obj = new URL(git_url);
  const owner_repo: OwnerAndRepo = {
    url: git_url, // SHOULD THIS BE ORIGINAL?
    owner: '',
    repo: '',
    cloning_url: '',
  };
  let cloning_url = git_url;
  let pathname: string = url_obj.pathname;
  if (pathname.startsWith('/')) {
    pathname = pathname.slice(1);
  }
  const url_owner: string = pathname.slice(0, pathname.indexOf('/'));
  let url_repo: string = pathname.slice(pathname.indexOf('/') + 1);

  if (url_repo.endsWith('.git')) {
    url_repo = url_repo.split('.git')[0];
    cloning_url = cloning_url.split('.git')[0];
  }
  owner_repo.owner = url_owner;
  owner_repo.repo = url_repo;

  const protocol: string = cloning_url.slice(0, cloning_url.indexOf(':'));
  // handle cloning url (form exactly like sample github urls)
  if (protocol.startsWith('https')) {
    owner_repo.cloning_url = cloning_url;
  } else if (protocol.startsWith('git+https')) {
    // remove git+ from beginning
    const new_url = cloning_url.slice(cloning_url.indexOf('+') + 1);
    owner_repo.cloning_url = new_url;
    // remove .git from end
  } else if (protocol.startsWith('git+ssh')) {
    // remove until :, replace with https:
    let new_url = 'https:' + cloning_url.slice(cloning_url.indexOf(':') + 1);
    // remove git@
    new_url = new_url.replace('git@', '');
    owner_repo.cloning_url = new_url;
  } else {
    globalThis.logger.error(`invalid repo URL from npm registry ${git_url}`);
  }
  return owner_repo.cloning_url;
}

export async function _get_urls_internal(
  filepath: string,
  urls: string[]
): Promise<Promise<URL_PARSE>[] | undefined> {
  try {
    let unparsed_urls: string[];
    if (filepath.length > 0) {
      unparsed_urls = await exports.read_file(filepath);
    } else {
      unparsed_urls = urls;
    }
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
                url_parse.github_repo_url = fix_github_url(potential_repo);
              }
            }
          }
        } else if (exports.check_if_github(url)) {
          // TODO: remove git+ or ssh style urls to the https style
          url_parse.github_repo_url = fix_github_url(url);
        }
        return url_parse;
      });
      return urls;
    } else {
      return undefined; // try-catch means can never be here
    }
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.error(
        `_get_urls: ${err.message}, stack: ${err.stack}`
      );
    }
  }
  return undefined;
}

export async function get_urls_from_file(
  filepath: string
): Promise<URL_PARSE[]> {
  const data: Promise<URL_PARSE>[] | undefined =
    await exports._get_urls_internal(filepath, []);
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

export async function get_url_parse_from_input(
  url: string
): Promise<URL_PARSE[]> {
  const data: Promise<URL_PARSE>[] | undefined =
    await exports._get_urls_internal('', [url]);
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
