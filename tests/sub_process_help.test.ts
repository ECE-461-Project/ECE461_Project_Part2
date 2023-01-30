import {run_cmd} from '../src/sub_process_help';
import * as child_process from 'child_process';

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
