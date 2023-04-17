import { readFileSync, writeFileSync } from 'fs';
import * as zip from '../../src/api_server/zip_files';
import { create_dir, delete_dir } from '../../src/git_clone';
import { git_clone, create_tmp } from '../../src/git_clone';
import { join } from 'path';

// This checks if the MANUAL env variable is defined
if (process.env.MANUAL === undefined) {
  describe = describe.skip;
}

jest.setTimeout(30000);
describe('check zip manually', () => {
    create_dir('manual_test_results');
    test('zip test', async () => {
      const temp = await create_tmp(); 
      const url = 'https://github.com/cloudinary/cloudinary_npm';
      await git_clone(temp, url);
      const package_path = join(temp, 'package');
      const a = await zip.generate_base64_zip_of_dir(package_path, package_path, 'cloudinary_npm');
      create_dir('manual_test_results/zip2');
      writeFileSync('manual_test_results/zip2/a.b64', a);
      await delete_dir(temp);
    });
    test('unzip test', async () => {
        const package_a_b64 = readFileSync('./tests/integration_tests/test_packages/package_a.zip.b64').toString();
        create_dir('manual_test_results/unzip1');
        expect(await zip.unzip_base64_to_dir(package_a_b64, 'manual_test_results/unzip1')).toBe('manual_test_results/unzip1');
    });
});
