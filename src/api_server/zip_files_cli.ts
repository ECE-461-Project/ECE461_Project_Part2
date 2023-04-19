import {getFiles} from './get_files';
import JSZip = require('jszip');
import {readFile} from 'fs/promises';
import {createWriteStream} from 'fs';
// ***************************
// This ensures jszip compiles
// https://stackoverflow.com/questions/66275648/aws-javascript-sdk-v3-typescript-doesnt-compile-due-to-error-ts2304-cannot-f
// Issue: https://github.com/Stuk/jszip/issues/693
export {};
/*
declare global {
  type ReadableStream = unknown;
  type Blob = unknown;
}
*/
// ****************************

// Ignores .git folder
export async function generate_base64_zip_of_dir(
  directory: string
): Promise<string> {
  const ignore_git = RegExp('^\\.git/');
  const zip = new JSZip();
  // If we want to do reading in parallel in the future:
  //  https://stackoverflow.com/questions/37576685/using-async-await-with-a-foreach-loop
  for await (const file of getFiles(directory)) {
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

async function main() {
  const args = process.argv.slice(2);
  console.log(await generate_base64_zip_of_dir(args[0]));
}
main();
