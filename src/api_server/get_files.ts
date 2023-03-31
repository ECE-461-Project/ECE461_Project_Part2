import {readdir} from 'fs/promises';
import {join} from 'path';

// Modified from https://coderrocketfuel.com/article/recursively-list-all-the-files-in-a-directory-using-node-js
//https://stackoverflow.com/questions/41462606/get-all-files-recursively-in-directories-nodejs
async function* getFiles(path: string): AsyncGenerator<string> {
  const entries = await readdir(path, {withFileTypes: true});

  for (const file of entries) {
    if (file.isDirectory()) {
      yield* getFiles(join(path, file.name));
    } else {
      yield join(path, file.name);
    }
  }
}

export async function getAllFiles(dirPath: string) {
  const array_of_files: string[] = [];
  for await (const file of getFiles(dirPath)) {
    array_of_files.push(file);
  }
  return array_of_files;
}
