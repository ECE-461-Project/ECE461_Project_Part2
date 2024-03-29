// You should use models for return
import {Request, Response} from 'express';
import {
  packages,
  users,
  usergroups,
  dependentPackageSize,
} from '../db_connector';
import {PackageName, PackageSizeReturn, SizecostInput} from '../models/models';
import {create_tmp, delete_dir, git_clone} from '../../git_clone';
import {run_cmd} from '../../sub_process_help';
import {join} from 'path';
import {
  check_if_npm,
  check_if_github,
  get_npm_package_name,
} from '../../url_parser';
import {unzip_base64_to_dir} from '../zip_files';
import {find_name_from_packagejson} from '../get_files';

export async function npm_compute_optional_update_package_name(
  names: PackageName[],
  update_db: boolean,
  delete_db: boolean,
  update_refcount: boolean
): Promise<number> {
  return npm_compute_optional_update_internal(
    names,
    update_db,
    delete_db,
    null,
    update_refcount
  );
}

export async function npm_compute_optional_update_directory(
  dirname: string,
  update_db: boolean,
  delete_db: boolean,
  update_refcount: boolean
): Promise<number> {
  globalThis.logger?.debug(
    `npm update dir: ${dirname} ${update_db} ${delete_db}`
  );
  return npm_compute_optional_update_internal(
    null,
    update_db,
    delete_db,
    dirname,
    update_refcount
  );
}

async function npm_compute_optional_update_internal(
  names: PackageName[] | null,
  update_db: boolean,
  delete_db: boolean,
  dirname: string | null,
  update_refcount: boolean
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
          // update based on upload/update (update_refcount arg)
          if (update_refcount) {
            await found.update({
              PackageName: new_indiv_arr_entry[1],
              PackageSize: new_indiv_arr_entry[0],
              RefCount: found.RefCount + 1,
            });
          } else {
            await found.update({
              PackageName: new_indiv_arr_entry[1],
              PackageSize: new_indiv_arr_entry[0],
            });
          }
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
  } catch (err) {
    if (err instanceof Error) {
      globalThis.logger?.error(`Error while npm install or du: ${err.message}`);
    }
    return -1;
  } finally {
    if (dirname === null && names !== null) {
      delete_dir(temp_dir);
    }
  }
  return size_cost;
}

export async function get_size_cost(req: Request, res: Response) {
  try {
    const input = req.body;
    if (input === undefined) {
      globalThis.logger?.error('Error in size cost request body');
      res.status(400).send();
      return;
    }

    if (input.length === 0) {
      globalThis.logger?.error('/sizecost NO INPUTS!!');
      res.status(400).send();
      return;
    }

    // eslint-disable-next-line prefer-const
    let names_arr: PackageName[] = [];

    globalThis.logger?.debug(`/sizecost INPUT ${input}`);
    // check if already in packages db and remove from input if so
    for (let i = 0; i < input.length; i++) {
      globalThis.logger?.debug(`Looping: input[${i}]`);
      let name = '';
      if (
        input[i].Name !== undefined &&
        input[i].URL === undefined &&
        input[i].Content === undefined
      ) {
        globalThis.logger?.debug('/sizecost input type Name');
        name = input[i].Name;
      } else if (
        input[i].URL !== undefined &&
        input[i].Name === undefined &&
        input[i].Content === undefined
      ) {
        globalThis.logger?.debug('/sizecost input type URL');
        if (check_if_npm(input[i].URL)) {
          name = get_npm_package_name(input[i].URL);
        } else if (check_if_github(input[i].URL)) {
          const tmp = await create_tmp();
          const check = await git_clone(tmp, input[i].URL);
          if (check !== false) {
            const name_val = await find_name_from_packagejson(tmp);
            if (name_val !== undefined) {
              name = name_val;
            }
          }
          delete_dir(tmp);
        }
      } else if (
        input[i].Content !== undefined &&
        input[i].Name === undefined &&
        input[i].URL === undefined
      ) {
        globalThis.logger?.debug('/sizecost input type Content');
        const tmp = await create_tmp();
        const check = await unzip_base64_to_dir(input[i].Content, tmp);
        if (check !== undefined) {
          const name_val = await find_name_from_packagejson(tmp);
          if (name_val !== undefined) {
            name = name_val;
          }
        }
        delete_dir(tmp);
      } else {
        globalThis.logger?.error('/sizecost input type none set!!! error');
        res.status(400).send();
        return;
      }
      globalThis.logger?.debug(`/sizecost name decided ${name}`);
      if (name === '') {
        globalThis.logger?.error(
          '/sizecost could not find name on an input!!! error'
        );
        res.status(400).send();
        return;
      }

      const found = await packages.findOne({
        where: {PackageName: name},
      });
      if (found) {
        globalThis.logger?.info(`/sizecost found ${name}`);
        input.splice(i, 1);
      } else {
        names_arr.push(name);
      }
    }

    if (names_arr.length === 0) {
      globalThis.logger?.info(
        '/sizecost all alr uploaded or no valid names, 0'
      );
      const ret1: PackageSizeReturn = {
        names: input.join(),
        size: 0,
      };
      res.contentType('application/json').status(200).send(ret1);
      return;
    }

    const size_cost = await npm_compute_optional_update_package_name(
      names_arr,
      false,
      false,
      false
    );
    const ret: PackageSizeReturn = {
      names: names_arr.join(),
      size: size_cost,
    };
    if (size_cost === -1) {
      globalThis.logger?.error('Size cost failed on the function to du');
      res.status(400).send();
      return;
    }
    res.contentType('application/json').status(200).send(ret);
  } catch (err: any) {
    globalThis.logger?.error(`Error in size cost: ${err}`);
    if (err instanceof Error) {
      res.status(400).send();
    } else {
      res.status(400).send();
    }
  }
}
