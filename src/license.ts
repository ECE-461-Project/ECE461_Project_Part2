const promisify = require('util.promisify-all');
// license-checker has no type file
const checker = promisify(require('license-checker'));

const path_to_check =
  '/home/just007in/Documents/_Class/_ECE461/projects/ECE461_Project';

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

// Example of promise using then
//get_licenses()
//  .catch((err: ReferenceError) => {
//    console.log(err);
//  })
//  .then((data: void | Object) => {
//    if (data instanceof Object) {
//      for (const [k, v] of Object.entries(data)) {
//        console.log(k);
//        console.log(v['licenses']);
//      }
//    }
//  });

// Example of using promise using async
// https://janelia-flyem.github.io/licenses.html
// https://en.wikipedia.org/wiki/ISC_license
// https://en.wikipedia.org/wiki/GNU_Lesser_General_Public_License#Differences_from_the_GPL
// Only allow the following licenses in module and dependencies:
//  MIT, Apache, ISC, WTFPL, BSD, BSD-Source-Code, CC0-1.0, Public Domain, LGPL-2.1-only, CC-BY-*
//  This uses SPDX Identifiers
async function check_licenses_result(): Promise<Boolean> {
  try {
    const licenses = await get_licenses(path_to_check);
    const license_regex = new RegExp(
      'MIT|Apache|ISC|WTFPL|BSD|BSD-Source-Code|CC0-1.0|Public Domain|LGPL-2.1-only|CC-BY-*'
    );
    //console.log(licenses);
    for (const [k, v] of Object.entries(licenses)) {
      if (license_regex.exec(v['licenses'])) {
        console.log(`${k} has valid license: ${v['licenses']}`);
      } else {
        console.log(`${k} has invalid license: ${v['licenses']}`);
        return false;
      }
    }
  } catch (err) {
    console.log(err);
    return false;
  }
  return true;
}

check_licenses_result().then((is_valid: Boolean) => {
  console.log(is_valid);
});
