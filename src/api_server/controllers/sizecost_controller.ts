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

async function npm_compute_optional_update(
  names: PackageName[],
  update_db: boolean
): Promise<number> {
  // give full list without -g to not "double install"
  const npm_folder_name = 'npm_install';
  let args = ['install', '--omit=dev'];
  args = args.concat(names);
  globalThis.logger?.debug(`Args: ${args}`);
  let size_cost = 0;

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

    if (typeof du_out !== 'string') {
      return 0;
    }
    const du_arr = du_out.split('\n');
    globalThis.logger?.debug(du_arr);
    globalThis.logger?.debug(du_arr[0]);
    for (const entry of du_arr) {
      // eslint-disable-next-line prefer-const
      let new_indiv_arr_entry = entry.split(/\s+/);
      if (new_indiv_arr_entry[1] === undefined) {
        continue;
      }
      new_indiv_arr_entry[1] = new_indiv_arr_entry[1].replace(/^\.\//, '');
      if (new_indiv_arr_entry[1].startsWith('.')) {
        globalThis.logger?.debug(`Skipping du entry ${new_indiv_arr_entry[1]}`);
        continue;
      }
      globalThis.logger?.debug(new_indiv_arr_entry[1]);
      // look up each valid dependency in db
      const found = await dependentPackageSize.findOne({
        where: {PackageName: new_indiv_arr_entry[1]},
      });
      // if update boolean true, update the database for the actually added packages (on upload)
      if (update_db === true) {
        if (found) {
          // update
          await found.update({
            PackageName: new_indiv_arr_entry[1],
            PackageSize: new_indiv_arr_entry[0],
          });
        } else {
          //create
          const dependent_uploaded = await dependentPackageSize.create({
            PackageName: new_indiv_arr_entry[1],
            PackageSize: new_indiv_arr_entry[0],
          });
        }
      }
      if (found) {
        continue;
      }
      // otherwise keep adding size to the total size cost
      size_cost += Number(new_indiv_arr_entry[0]);
    }
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.error(`Error while npm install or du: ${err.message}`);
    }
    return 0;
  }
  return size_cost;
}

export async function get_size_cost(req: Request, res: Response) {
  try {
    const size_cost = await npm_compute_optional_update(
      ['cloudinary', 'lodash'],
      false
    );
    const sample: PackageSizeReturn = {
      name: 'cloudinary, lodash',
      size: size_cost,
    };
    const arr: PackageSizeReturn[] = [sample];
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
