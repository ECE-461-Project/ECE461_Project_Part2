import {spawn} from 'child_process';
import {join} from 'path';
import {tmpdir} from 'os';
import {rm, mkdtemp} from 'fs/promises';

const promisify = require('util.promisify-all');
// license-checker has no type file
const checker = promisify(require('license-checker'));

//https://blog.mastykarz.nl/create-temp-directory-app-node-js/
async function create_tmp(): Promise<string> {
  try {
    const tmpDir = await mkdtemp(join(tmpdir(), 'npm-package-data-'));
    console.log(tmpDir);
    return tmpDir;
  } catch (err) {
    console.log(err);
  }
  return '';
}

async function delete_dir(directory: string) {
  try {
    if (directory) {
      await rm(directory, {recursive: true, force: true});
    }
  } catch (err) {
    console.log(err);
  }
}

//https://stackoverflow.com/questions/15515549/node-js-writing-a-function-to-return-spawn-stdout-as-a-string
function run_cmd(
  cmd: string,
  args?: Array<string>,
  options?: Object
): Promise<string | ReferenceError> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, options);
    let output = '';
    child.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });
    child.on('close', (code: number) => {
      console.log(`child process ${cmd} ${args} closed on ${code}`);
      resolve(output);
    });
    child.on('exit', (code: number) => {
      console.log(`child process ${cmd} ${args} exit on ${code}`);
      resolve(output);
    });
    child.on('error', (err: ReferenceError) => {
      reject(err);
    });
  });
}

async function clone_and_install(
  tmp_dir: string,
  git_url: string
): Promise<boolean> {
  const git_folder_name = 'package';
  try {
    const git_out = await run_cmd('git', ['clone', git_url, git_folder_name], {
      cwd: tmp_dir,
    });
    console.log(git_out);
  } catch (err) {
    console.log(err);
    return false;
  }
  try {
    const npm_out = await run_cmd('npm', ['install'], {
      cwd: join(tmp_dir, git_folder_name),
    });
    console.log(npm_out);
  } catch (err) {
    console.log(err);
    return false;
  }
  return true;
}

//async function output() {
//  for await (const data of child.stdout) {
//    console.log(data.toString());
//  }
//}

function get_licenses(path: string): Promise<Object> {
  const options = {
    start: path,
    //failOn: 'hi;test',
    //json: true,
    direct: Infinity,
    color: false,
  };
  return checker.init(options);
}

// Example of using promise using async
// https://janelia-flyem.github.io/licenses.html
// https://en.wikipedia.org/wiki/ISC_license
// https://en.wikipedia.org/wiki/GNU_Lesser_General_Public_License#Differences_from_the_GPL
// Only allow the following licenses in module and dependencies:
//  MIT, Apache, ISC, WTFPL, BSD, BSD-Source-Code, CC0-1.0, Public Domain, LGPL-2.1-only, CC-BY-*
//  This uses SPDX Identifiers
// Does NOT handle custom or unlicenses modules. Defaults them to valid for now.
async function check_licenses_result(path_to_check: string): Promise<Boolean> {
  let is_valid = true;
  try {
    const licenses = await get_licenses(path_to_check);
    const license_regex = new RegExp(
      'MIT|Apache|ISC|WTFPL|BSD|BSD-Source-Code|CC0-1.0|Public Domain|LGPL-2.1-only|CC-BY-*'
    );
    const unhandled_regex = new RegExp('Custom|Unlicense');
    //console.log(licenses);
    for (const [k, v] of Object.entries(licenses)) {
      if (license_regex.exec(v['licenses'])) {
        console.log(`${k} has valid license: ${v['licenses']}`);
      } else if (unhandled_regex.exec(v['licenses'])) {
        console.log(`${k} has unhandled license: ${v['licenses']}`);
      } else {
        console.log(`${k} has invalid license: ${v['licenses']}`);
        is_valid = false;
      }
    }
  } catch (err) {
    console.log(err);
    return false;
  }
  return is_valid;
}

async function get_license_score(): Promise<number> {
  const tmp_dir: string = await create_tmp();
  // note: 'package' is const in local_file_creation, should move for less duplication
  const path_to_check = join(tmp_dir, 'package');

  const success = await clone_and_install(
    tmp_dir,
    'git@github.com:davglass/license-checker.git'
  );
  if (!success) {
    console.log('Unable to analyze local files for licenses');
    delete_dir(tmp_dir);
    return 0;
  }
  const is_valid = await check_licenses_result(path_to_check);
  console.log(is_valid);

  const score = is_valid ? 1 : 0;

  delete_dir(tmp_dir);
  return score;
}

get_license_score().then((data: number) => {
  console.log(data);
});
