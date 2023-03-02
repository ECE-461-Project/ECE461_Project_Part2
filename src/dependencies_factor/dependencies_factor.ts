import {readFileSync} from 'fs';
import {join} from 'path';

export function check_if_pinned(dependency_version: string): boolean {
  console.log(dependency_version);
  const pinned_regex = /^=*\d+\.\d+/gm;
  const match = dependency_version.match(pinned_regex);
  console.log(match);
  if (match === null) {
    return false;
  } else {
    return true;
  }
}

export async function get_dependencies_score(
  repo_url: string,
  local_repo_path: string
): Promise<number> {
  try {
    const package_json = JSON.parse(
      readFileSync(join(local_repo_path, 'package.json')).toString()
    );
    const check_exists: string | undefined = package_json.dependencies;
    if (check_exists !== null && check_exists !== undefined) {
      const dependencies = JSON.parse(
        JSON.stringify(package_json.dependencies)
      );
      globalThis.logger?.info(`${repo_url} has dependencies!`);
      let num_dependencies = 0;
      let num_pinned_dependencies = 0;
      for (const dependency in dependencies) {
        // eslint-disable-next-line no-prototype-builtins
        if (dependencies.hasOwnProperty(dependency)) {
          num_dependencies++;
          if (check_if_pinned(dependencies[dependency])) {
            num_pinned_dependencies++;
          }
        }
      }
      console.log(num_dependencies);
      console.log(num_pinned_dependencies);
      if (num_pinned_dependencies > 0) {
        return 1 / num_pinned_dependencies;
      } else {
        return 1;
      }
    } else {
      return 1;
    }
  } catch (err) {
    if (err instanceof Error) {
      console.log(err.message);
      globalThis.logger?.error(`License Score calc got error: ${err.message}`);
    }
    return 0;
  }
}
