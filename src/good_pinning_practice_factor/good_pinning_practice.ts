import {AggregateFilePromise} from '../aggregate_request';

// Regex from official semver exact versioning regex, and
// https://gist.github.com/jhorsman/62eeea161a13b80e39f5249281e17c39
// method of testing https://regex101.com/r/F0H152/1
export function check_if_pinned(dependency_version: string): boolean {
  // figure out if tilde patching is valid spec
  // figure out if 1.2.x is valid spec (is probably, this regex does not do this)
  const pinned_regex =
    /^~?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]|x\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/gm;
  const match = dependency_version.match(pinned_regex);
  if (match === null) {
    return false;
  } else {
    return true;
  }
}

export async function get_good_pinning_practice_score(
  repo_url: string,
  aggregate_file: AggregateFilePromise
): Promise<number> {
  try {
    const package_json = await aggregate_file.package_json;
    const check_exists: string | undefined = package_json.dependencies;
    if (check_exists !== null && check_exists !== undefined) {
      const dependencies = JSON.parse(
        JSON.stringify(package_json.dependencies)
      );

      let num_dependencies = 0;
      let num_pinned_dependencies = 0;
      for (const dependency in dependencies) {
        if (Object.prototype.hasOwnProperty.call(dependencies, dependency)) {
          num_dependencies++;
          if (check_if_pinned(dependencies[dependency])) {
            num_pinned_dependencies++;
          }
        }
      }
      globalThis.logger?.info(
        `${repo_url} has ${num_dependencies} dependencies and ${num_pinned_dependencies} pinned!`
      );
      if (num_pinned_dependencies > 0) {
        return 1 / (1 + num_pinned_dependencies);
      } else {
        return 1;
      }
    } else {
      return 1;
    }
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.error(
        `Dependencies Score calc got error, returning 1: ${err.message}`
      );
    } else {
      globalThis.logger?.error(
        `Dependencies Score calc got error, returning 1: ${err}`
      );
    }
    return 0;
  }
}
