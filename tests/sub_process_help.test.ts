import {run_cmd} from '../src/sub_process_help';
import * as child_process from 'child_process';
import {create_logger} from '../src/logging_setup';

process.env.LOG_LEVEL = '0';
process.env.LOG_FILE = 'log_file.txt';
create_logger();

describe('testing run_cmd', () => {
  test('no error', async () => {
    const out: string | ReferenceError = await run_cmd('echo', ['hi']);
    expect(out).toBeDefined();
  });
  test('error', async () => {
    const out: string | ReferenceError = await run_cmd('pwd', ['-x']);
    expect(out).toBeDefined();
  });
});
