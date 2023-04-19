import {readdir, readFile, opendir} from 'fs/promises';
import {join} from 'path';
import path = require('path');

// Modified from https://coderrocketfuel.com/article/recursively-list-all-the-files-in-a-directory-using-node-js
//https://stackoverflow.com/questions/41462606/get-all-files-recursively-in-directories-nodejs
export async function* getFiles(path: string): AsyncGenerator<string> {
  /*
  const entries = await readdir(path, {withFileTypes: true});

  for (const file of entries) {
    if (file.isDirectory()) {
      yield* getFiles(join(path, file.name));
    } else {
      yield join(path, file.name);
    }
  }
  */
  // This is so only one directory handle is openned with default 32 objects buffered
  let dir;
  const directories: string[] = [];
  try {
    dir = await opendir(path);
    for await (const dirent of dir) {
      if (dirent.isDirectory()) {
        directories.push(dirent.name);
      } else {
        yield join(path, dirent.name);
      }
    }
    // dir auto closed after for await completes
  } catch (err) {
    globalThis.logger?.error(`Error in getFiles: ${err}`);
    dir?.close();
    // Throw error so calling function knows getFiles failed
    throw err;
  }
  // Auto throw errors from recursive calls
  for (const directory of directories) {
    yield* getFiles(join(path, directory));
  }
}

export async function find_and_read_package_json(
  directory: string
): Promise<string | undefined> {
  globalThis.logger?.debug(
    `dir input to find_and_read_package_json ${directory}`
  );
  // getFiles changed so it returns files in base directory first
  for await (const filename of getFiles(directory)) {
    if (path.basename(filename) === 'package.json') {
      const strcontent = await readFile(filename);
      globalThis.logger?.debug(`found package.json: ${filename}`);
      return strcontent.toString();
    }
  }
  return undefined;
}
