import {get_license_score} from './license_score_calc/license';
import {get_urls} from './url_parser';

console.log('hello');

get_license_score('git@github.com:davglass/license-checker.git').then(
  (data: number) => {
    console.log(data);
  }
);

async function main() {
  const val = await get_urls('./tests/_urls/url_test1.txt');
  console.log(val);
}

main();
