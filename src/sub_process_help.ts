import {spawn} from 'child_process';

//https://stackoverflow.com/questions/15515549/node-js-writing-a-function-to-return-spawn-stdout-as-a-string
export function run_cmd(
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
      globalThis.logger.debug(`child process ${cmd} ${args} closed on ${code}`);
      resolve(output);
    });
    child.on('exit', (code: number) => {
      globalThis.logger.debug(`child process ${cmd} ${args} exit on ${code}`);
      resolve(output);
    });
    child.on('error', (err: ReferenceError) => {
      reject(err);
    });
  });
}
