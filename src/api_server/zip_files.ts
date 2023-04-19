import {getFiles} from './get_files';
import JSZip = require('jszip');
import {readFile} from 'fs/promises';
import {writeFile} from 'fs/promises';
import {mkdir} from 'fs/promises';
import {tmpdir} from 'os';
import {mkdtemp} from 'fs/promises';
import {join} from 'path';
import {run_cmd} from '../sub_process_help';
import {delete_dir} from '../git_clone';

// ***************************
// This ensures jszip compiles
// https://stackoverflow.com/questions/66275648/aws-javascript-sdk-v3-typescript-doesnt-compile-due-to-error-ts2304-cannot-f
// Issue: https://github.com/Stuk/jszip/issues/693
export {};

declare global {
  type ReadableStream = unknown;
  type Blob = unknown;
}
// ****************************

// Ignores .git folder
// Debloat: test directory
export async function generate_base64_zip_of_dir(
  directory: string,
  path_remove: string,
  parent: string
): Promise<string> {
  const ignore_git = RegExp('\\.git/');
  const ignore_github = RegExp('\\.github/');
  const ignore_test = RegExp('/_*tests?_*/');
  const zip = new JSZip();
  // If we want to do reading in parallel in the future:
  //  https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
  for await (const file of getFiles(directory)) {
    if (ignore_git.exec(file)) {
      continue;
    }
    if (ignore_github.exec(file)) {
      continue;
    }
    if (ignore_test.exec(file)) {
      continue;
    }
    const fileContent = await readFile(file, 'utf-8');

    // Flatten folders
    const filename = join(parent, file.replace(path_remove, ''));
    zip.file(filename, fileContent, {createFolders: true});
  }
  return zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
    compressionOptions: {level: 6},
    streamFiles: true,
  });
}

export async function unzip_base64_to_dir(
  b64_data: string,
  directory: string
): Promise<string | undefined> {
  try {
    let zip = new JSZip();
    zip = await zip.loadAsync(b64_data, {base64: true, createFolders: true});
    for (const filename in zip.files) {
      if (zip.file(filename)?.dir === false) {
        const content = await zip.file(filename)?.async('nodebuffer');
        if (content) {
          await writeFile(join(directory, filename), content);
        }
      } else {
        await mkdir(join(directory, filename), {recursive: true});
      }
    }
    return directory;
  } catch (err) {
    globalThis.logger?.error('Failed to unzip file');
    return undefined;
  }
}

/*
async function main() {
  console.log(await generate_base64_zip_of_dir('./'));
}
main();
*/
