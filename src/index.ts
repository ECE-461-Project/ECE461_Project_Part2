import {join} from 'path';

import {check_licenses_result} from './license';
import {
  create_tmp_sync,
  clone_and_install,
  delete_dir,
} from './local_file_creation';

async function main() {
  const tmp_dir: string = create_tmp_sync();
  // note: 'package' is const in local_file_creation, should move for less duplication
  const path_to_check = join(tmp_dir, 'package');

  const success = await clone_and_install(
    tmp_dir,
    'git@github.com:davglass/license-checker.git'
  );
  if (success) {
    const is_valid = await check_licenses_result(path_to_check);
    console.log(is_valid);
  } else {
    console.log('Unable to analyze local files for licenses');
  }

  delete_dir(tmp_dir);
}

main();
