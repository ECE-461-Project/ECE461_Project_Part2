import {tmpdir} from 'os';
import {rm, mkdtemp, mkdir} from 'fs/promises';
import {join} from 'path';
import {run_cmd} from './sub_process_help';
import git = require('isomorphic-git');
import http = require('isomorphic-git/http/node');
import fs = require('graceful-fs');
import PQueue = require('p-queue');

// DO NOT USE THE FS MODULE HERE FOR ANYTHING ELSE OTHER THAN GIT CLONE
const write_queue = new PQueue.default({concurrency: 1});
const orig_writeFile = fs.promises.writeFile;
async function new_writeFile(
  path: any,
  data: any,
  options: any
): Promise<undefined> {
  await write_queue.add(() => {
    return orig_writeFile(path, data, options);
  });
  return undefined;
}
fs.promises.writeFile = new_writeFile;

//https://blog.mastykarz.nl/create-temp-directory-app-node-js/
// TODO: Will change to not create folder in tmp! For final storage of packages
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

export async function create_dir(directory: string) {
  try {
    await mkdir(directory);
  } catch (err) {
    globalThis.logger?.error(`creating directory ${directory} failed`);
  }
}

export async function git_clone(
  tmp_dir: string,
  git_url: string
): Promise<boolean> {
  const git_folder_name = 'package';
  const dir = join(tmp_dir, git_folder_name);
  try {
    await git.clone({
      fs,
      http,
      dir,
      url: git_url,
      singleBranch: true,
      noTags: true,
      depth: 1,
    });
    globalThis.logger?.info(`Cloning ${git_url} at folder ${dir} succeeded`);
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.error(
        `Error while cloning ${git_url} at folder ${dir}: ${err.message}`
      );
    } else {
      globalThis.logger?.error(
        `Error while cloning ${git_url} at folder ${dir}: ${err}`
      );
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
