import {create_tmp, delete_dir, git_clone, npm_install} from '../src/git_clone';
import * as sub_process_help from '../src/sub_process_help';

// imports to mock
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';
import {PathLike, RmOptions} from 'fs';
import {create_logger} from '../src/logging_setup';

process.env.LOG_LEVEL = '0';
process.env.LOG_FILE = 'log_file.txt';
create_logger();
//import {tmpdir} from 'os';
//import {rm, mkdtemp} from 'fs/promises';
//import {join} from 'path';

//jest.mock('os', () => ({
//  __esModule: true,
//  ...jest.requireActual('os'),
//  tmpdir: () => jest.fn(),
//}));

//jest.mock('fs/promises', () => ({
//  __esModule: true,
//  ...jest.requireActual('fs/promises'),
//  rm: () => jest.fn(),
//}));

//jest.mock('os');
describe('testing git_clone', () => {
  test('clone_and_install succeeds', async () => {
    jest.spyOn(sub_process_help, 'run_cmd').mockResolvedValue('stdout');
    expect(await git_clone('directory', 'url')).toBe(true);
  });
  test('git_clone fails', async () => {
    jest
      .spyOn(sub_process_help, 'run_cmd')
      .mockRejectedValue(new Error('First Error'));
    expect(await git_clone('directory', 'url')).toBe(false);
  });
});

describe('testing npm_install', () => {
  test('npm_install succeeds', async () => {
    jest.spyOn(sub_process_help, 'run_cmd').mockResolvedValue('stdout');
    expect(await npm_install('directory')).toBe(true);
  });
  test('npm_install fails first cmd', async () => {
    jest
      .spyOn(sub_process_help, 'run_cmd')
      .mockRejectedValue(new Error('First Error'));
    expect(await npm_install('directory')).toBe(false);
  });
});

describe('testing create_tmp', () => {
  jest.spyOn(os, 'tmpdir').mockReturnValue('/tmp');
  jest.spyOn(path, 'join').mockImplementation((str1: string, str2: string) => {
    return str1 + '/' + str2;
  });
  test('should return tmp_dir', async () => {
    jest.spyOn(fs, 'mkdtemp').mockImplementation((str1: string) => {
      return new Promise((resolve, reject) => {
        resolve(str1 + 'asdf');
      });
    });
    const result: string = await create_tmp();
    expect(result).toBe('/tmp/npm-package-data-asdf');
  });
  test('should throw from failure', async () => {
    jest.spyOn(fs, 'mkdtemp').mockImplementation((str1: string) => {
      return new Promise((resolve, reject) => {
        reject(new Error('Fake error'));
      });
    });
    await expect(create_tmp()).rejects.toThrow();
  });
});

describe('testing delete_dir', () => {
  test('should call rm on valid directory', async () => {
    jest
      .spyOn(fs, 'rm')
      .mockImplementation((str1: PathLike, options?: RmOptions | undefined) => {
        return new Promise((resolve, reject) => {
          resolve(undefined);
        });
      });
    const result: void = await delete_dir('/tmp');
    expect(result).toBe(undefined);
  });
  test('should call rm on invalid directory', async () => {
    jest
      .spyOn(fs, 'rm')
      .mockImplementation((str1: PathLike, options?: RmOptions | undefined) => {
        return new Promise((resolve, reject) => {
          reject(new Error('Fake Error'));
        });
      });
    const result: void = await delete_dir('/tmp');
    expect(result).toBe(undefined);
  });
});
