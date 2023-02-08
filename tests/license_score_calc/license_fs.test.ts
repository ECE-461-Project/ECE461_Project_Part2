import {create_tmp, delete_dir} from '../../src/license_score_calc/license_fs';

// imports to mock
import * as os from 'os';
import * as fs from 'fs/promises';
import * as path from 'path';
import {PathLike, RmOptions} from 'fs';
import {create_logger} from '../../src/logging_setup';

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
  test('should return empty string from failure', async () => {
    jest.spyOn(fs, 'mkdtemp').mockImplementation((str1: string) => {
      return new Promise((resolve, reject) => {
        reject(new Error('Fake error'));
      });
    });
    const result: string = await create_tmp();
    expect(result).toBe('');
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
