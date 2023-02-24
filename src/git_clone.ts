import {tmpdir} from 'os';
import {rm, mkdtemp} from 'fs/promises';
import {join} from 'path';
import {run_cmd} from './sub_process_help';

//https://blog.mastykarz.nl/create-temp-directory-app-node-js/
export async function create_tmp(): Promise<string> {
  try {
    const tmpDir = await mkdtemp(join(tmpdir(), 'npm-package-data-'));
    globalThis.logger?.info(`Created temp folder: ${tmpDir}`);
    return tmpDir;
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.info('temp folder creation failed');
    }
    throw new Error('Temporary Directory Creation failed');
  }
}

export async function delete_dir(directory: string) {
  try {
    if (directory) {
      await rm(directory, {recursive: true, force: true});
    }
  } catch (err) {
    globalThis.logger?.error(`deleting directory ${directory} failed`);
  }
}

export async function git_clone(
  tmp_dir: string,
  git_url: string
): Promise<boolean> {
  const git_folder_name = 'package';
  try {
    const git_out = await run_cmd('git', ['clone', git_url, git_folder_name], {
      cwd: tmp_dir,
    });
    globalThis.logger?.debug(git_out);
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.error(`Error while cloning: ${err.message}`);
    }
    return false;
  }
  return true;
}

export async function npm_install(tmp_dir: string): Promise<boolean> {
  const git_folder_name = 'package';
  try {
    const npm_out = await run_cmd('npm', ['install', '--omit=dev'], {
      cwd: join(tmp_dir, git_folder_name),
    });
    globalThis.logger?.debug(npm_out);
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.error(`Error while npm install: ${err.message}`);
    }
    return false;
  }
  return true;
}
