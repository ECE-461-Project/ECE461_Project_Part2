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

export async function npm_compute_optional_update_package_name(
  names: PackageName[],
  update_db: boolean,
  delete_db: boolean
): Promise<number> {
  return npm_compute_optional_update_internal(
    names,
    update_db,
    delete_db,
    null
  );
}

export async function npm_compute_optional_update_directory(
  dirname: string,
  update_db: boolean,
  delete_db: boolean
): Promise<number> {
  globalThis.logger?.debug(
    `npm update dir: ${dirname} ${update_db} ${delete_db}`
  );
  return npm_compute_optional_update_internal(
    null,
    update_db,
    delete_db,
    dirname
  );
}

async function npm_compute_optional_update_internal(
  names: PackageName[] | null,
  update_db: boolean,
  delete_db: boolean,
  dirname: string | null
): Promise<number> {
  // give full list without -g to not "double install"
  let args = ['install', '--omit=dev'];
  if (dirname === null && names !== null) {
    args = args.concat(names);
  }
  globalThis.logger?.debug(`Args: ${args}`);
  let size_cost = 0;
  let temp_dir = '';
  if (dirname !== null && names === null) {
    temp_dir = dirname;
  } else {
    temp_dir = await create_tmp();
  }
  try {
    const npm_out = await run_cmd('/usr/local/bin/npm', args, {
      cwd: join(temp_dir),
    });
    globalThis.logger?.debug(npm_out);
    const du_out = await run_cmd('du', ['-d', '1', '-b'], {
      cwd: join(temp_dir, 'node_modules'),
    });
    globalThis.logger?.debug(du_out);

    if (typeof du_out !== 'string') {
      globalThis.logger?.error('Error with du command in size cost!');
      if (dirname === null && names !== null) {
        delete_dir(temp_dir);
      }
      return -1;
    }
    const du_arr = du_out.split('\n');
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
            RefCount: found.RefCount + 1,
          });
        } else {
          //create
          const dependent_uploaded = await dependentPackageSize.create({
            PackageName: new_indiv_arr_entry[1],
            PackageSize: new_indiv_arr_entry[0],
            RefCount: 1,
          });
        }
      }
      if (delete_db === true) {
        if (found) {
          //delete
          if (found.RefCount === 1) {
            await found.destroy();
          } else {
            //decrement reference counter
            await found.update({
              PackageName: new_indiv_arr_entry[1],
              PackageSize: new_indiv_arr_entry[0],
              RefCount: found.RefCount - 1,
            });
          }
        }
      }
      if (found) {
        continue;
      }
      // otherwise keep adding size to the total size cost
      size_cost += Number(new_indiv_arr_entry[0]);
    }
    if (dirname === null && names !== null) {
      delete_dir(temp_dir);
    }
  } catch (err) {
    if (err instanceof Error) {
      if (dirname === null && names !== null) {
        delete_dir(temp_dir);
      }
      globalThis.logger?.error(`Error while npm install or du: ${err.message}`);
    }
    return -1;
  }
  return size_cost;
}

export async function get_size_cost(req: Request, res: Response) {
  try {
    const input = req.body;
    if (input === undefined) {
      globalThis.logger?.error(`Error in size cost request body`);
      res.status(400).send();
      return;
    }
    globalThis.logger?.debug(input);

    const size_cost = await npm_compute_optional_update_package_name(
      ['cloudinary', 'lodash'],
      true,
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
