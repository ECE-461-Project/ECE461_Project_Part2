import {tmpdir} from 'os';
import {rm, mkdtemp} from 'fs/promises';
import {join} from 'path';

//https://blog.mastykarz.nl/create-temp-directory-app-node-js/
export async function create_tmp(): Promise<string> {
  try {
    const tmpDir = await mkdtemp(join(tmpdir(), 'npm-package-data-'));
    globalThis.logger.info(`Created temp folder: ${tmpDir}`);
    return tmpDir;
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger.info('temp folder creation failed');
    }
  }
  return '';
}

export async function delete_dir(directory: string) {
  try {
    if (directory) {
      await rm(directory, {recursive: true, force: true});
    }
  } catch (err) {
    globalThis.logger.error(`deleting directory ${directory} failed`);
  }
}
