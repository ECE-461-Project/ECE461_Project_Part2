const getPackageGithubUrl = require('get-package-github-url');
const gh = require('parse-github-url');

export interface GitHubUrl_Info {
  original: string;
  github_repo_url: string;
  owner: string;
  repo: string;
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

function get_github_url_info(
  original: string,
  git_url: string
): GitHubUrl_Info {
  const parsed = gh(git_url);
  const info: GitHubUrl_Info = {
    original: original,
    github_repo_url: `https://github.com/${parsed.owner}/${parsed.name}`,
    owner: parsed.owner,
    repo: parsed.name,
  };
  return info;
}

export async function get_url_parse_from_input(
  url: string
): Promise<GitHubUrl_Info | undefined> {
  if (exports.check_if_npm(url)) {
    const package_name = exports.get_npm_package_name(url);
    if (package_name) {
      const potential_repo = await exports.get_github_url(package_name);
      if (potential_repo) {
        if (exports.check_if_github(potential_repo)) {
          return get_github_url_info(url, potential_repo);
        }
      }
    }
  } else if (exports.check_if_github(url)) {
    return get_github_url_info(url, url);
  }
  return undefined;
}
