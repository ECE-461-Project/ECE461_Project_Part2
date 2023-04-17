import {getAllFiles} from './get_files';
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
  const array_of_files = await getAllFiles(directory);
  // If we want to do reading in parallel in the future:
  //  https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
  for (const file of array_of_files) {
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
  // Should we do compression:
  //  https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html#compression-and-compressionoptions-options
  //  NOTE: Default is already compressed!
  return zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
    compressionOptions: {level: 6},
  });

  /*
  // If you want to stream zip to filesystem
  // https://stuk.github.io/jszip/documentation/howto/write_zip.html
  // From jszip doc
  // For manually validation
  zip
    .generateNodeStream({type: 'nodebuffer', streamFiles: true})
    .pipe(createWriteStream('out.zip'))
    .on('finish', () => {
      // JSZip generates a readable stream with a "end" event,
      // but is piped here in a writable stream which emits a "finish" event.
      console.log('out.zip written.');
    });
    return '';
    */
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
