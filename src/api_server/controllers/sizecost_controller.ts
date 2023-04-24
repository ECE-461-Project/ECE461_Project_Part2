// You should use models for return
import {Request, Response} from 'express';
import {
  packages,
  users,
  usergroups,
  dependentPackageSize,
} from '../db_connector';
import {PackageName, PackageSizeReturn} from '../models/models';
import {create_tmp, delete_dir} from '../../git_clone';
import {run_cmd} from '../../sub_process_help';
import {join} from 'path';

async function update_with_sizes(names: PackageName[]) {
  // database update
}

async function npm_write_to_temp_dir(names: PackageName[]): Promise<boolean> {
  // give full list without -g to not "double install"
  const npm_folder_name = 'npm_install';
  let args = ['install', '--omit=dev'];
  args = args.concat(names);
  globalThis.logger?.debug(`Args: ${args}`);
  try {
    const temp_dir = await create_tmp();
    const npm_out = await run_cmd('/usr/local/bin/npm', args, {
      cwd: join(temp_dir),
    });
    globalThis.logger?.debug(npm_out);
    const du_out = await run_cmd('du', ['-d', '1', '-b'], {
      cwd: join(temp_dir, 'node_modules'),
    });
    globalThis.logger?.debug(du_out);
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.error(`Error while npm install: ${err.message}`);
    }
    return false;
  }
  return true;
}

export async function get_size_cost(req: Request, res: Response) {
  try {
    const sample: PackageSizeReturn = {
      name: 'lodash',
      size: 5000,
    };
    const arr: PackageSizeReturn[] = [sample];
    npm_write_to_temp_dir(['cloudinary', 'lodash']);
    res.contentType('application/json').status(200).send(arr);
  } catch (err: any) {
    globalThis.logger?.error(`Error in size cost: ${err}`);
    if (err instanceof Error) {
      res.status(400).send();
    } else {
      res.status(400).send();
    }
  }
}
