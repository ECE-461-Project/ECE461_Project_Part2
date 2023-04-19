import {readdir, readFile} from 'fs/promises';
import {join} from 'path';
import path = require('path');

// Modified from https://coderrocketfuel.com/article/recursively-list-all-the-files-in-a-directory-using-node-js
//https://stackoverflow.com/questions/41462606/get-all-files-recursively-in-directories-nodejs
export async function* getFiles(path: string): AsyncGenerator<string> {
  const entries = await readdir(path, {withFileTypes: true});

  for (const file of entries) {
    if (file.isDirectory()) {
      yield* getFiles(join(path, file.name));
    } else {
      yield join(path, file.name);
    }
  }
}

async function read_package_json_contents(
  directory: string
): Promise<string | undefined> {
  globalThis.logger?.info(
    `dir input to helper read_package_json_contents ${directory}`
  );

  const entries = await readdir(directory, {withFileTypes: true});
  for (const file of entries) {
    if (!file.isDirectory()) {
      globalThis.logger?.info(
        `checking filenames in dir ${directory}: ${file.name}`
      );
      if (path.basename(file.name) === 'package.json') {
        const strcontent = await readFile(join(directory, file.name));
        return strcontent.toString();
      }
    }
  }
  return undefined;
}

export async function find_and_read_package_json(
  directory: string
): Promise<string | undefined> {
  globalThis.logger?.info(
    `dir input to find_and_read_package_json ${directory}`
  );

  const package_json = await read_package_json_contents(directory);
  if (package_json !== undefined) {
    globalThis.logger?.info(`found package.json at level ${directory}`);
    return package_json;
  }

  globalThis.logger?.info(`could not find package.json at level ${directory}`);
  const entries = await readdir(directory, {withFileTypes: true});
  for (const file of entries) {
    globalThis.logger?.info(`looking through level ${directory}/${file.name}`);
    if (file.isDirectory()) {
      const package_json = await read_package_json_contents(
        join(directory, file.name)
      );
      if (package_json !== undefined) {
        return package_json;
      }
    }
  }
  return undefined;
}
