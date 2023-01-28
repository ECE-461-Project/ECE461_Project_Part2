import {spawn} from 'child_process';
import {mkdtempSync, rmSync} from 'fs';
import {join} from 'path';
import {tmpdir} from 'os';

//https://blog.mastykarz.nl/create-temp-directory-app-node-js/
export function create_tmp_sync(): string {
  let tmpDir = '';
  try {
    tmpDir = mkdtempSync(join(tmpdir(), 'npm-package-data-'));
    console.log(tmpDir);
  } catch (err) {
    console.log(err);
  }
  return tmpDir;
}

export function delete_dir(directory: string) {
  try {
    if (directory) {
      rmSync(directory, {recursive: true});
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

export async function clone_and_install(tmp_dir: string, git_url: string) {
  const git_folder_name = 'package';
  try {
    const git_out = await run_cmd('git', ['clone', git_url, git_folder_name], {
      cwd: tmp_dir,
    });
    console.log(git_out);
  } catch (err) {
    console.log(err);
  }
  try {
    const npm_out = await run_cmd('npm', ['install'], {
      cwd: join(tmp_dir, git_folder_name),
    });
    console.log(npm_out);
  } catch (err) {
    console.log(err);
  }
}

//const tmp_dir: string = create_tmp_sync();
//clone_and_install(tmp_dir, 'git@github.com:davglass/license-checker.git');
//delete_dir(tmp_dir);

//(async () => {
//  const out = await run_cmd('ls', ['-l', '-a'], {cwd: '/tmp'});
//  console.log(out);
//})();

//async function output() {
//  for await (const data of child.stdout) {
//    console.log(data.toString());
//  }
//}
