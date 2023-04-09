import {getAllFiles} from './get_files';
import JSZip = require('jszip');
import {readFile} from 'fs/promises';
import {writeFile, writeFileSync} from 'fs';
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
export async function generate_base64_zip_of_dir(
  directory: string
): Promise<string> {
  const ignore_git = RegExp('^\\.git/');
  const zip = new JSZip();
  const array_of_files = await getAllFiles(directory);
  // If we want to do reading in parallel in the future:
  //  https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
  for (const file of array_of_files) {
    if (!ignore_git.exec(file)) {
      const fileContent = await readFile(file, 'utf-8');
      zip.file(file, fileContent, {createFolders: true});
    }
  }
  // Should we do compression:
  //  https://stuk.github.io/jszip/documentation/api_jszip/generate_async.html#compression-and-compressionoptions-options
  //  NOTE: Default is already compressed!
  return zip.generateAsync({type: 'base64'});
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
  const buf = Buffer.from(b64_data, 'base64');
  const tmpDir = await mkdtemp(join(tmpdir(), 'upload-zip-'));
  const zipfile = join(tmpDir, 'upload.zip');
  try {
    writeFileSync(zipfile, buf);
    // file written successfully
    // unzip to the directory specified
    const unzip_out = await run_cmd('unzip', [zipfile, '-d', directory], {
      cwd: tmpDir,
    });
    delete_dir(tmpDir);
    return directory;
  } catch (err) {
    delete_dir(tmpDir);
    return undefined;
  }
}

/*
async function main() {
  console.log(await generate_base64_zip_of_dir('./'));
}
main();
*/
