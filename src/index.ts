import {get_license_score} from './license_score_calc/license';

console.log('hello');

get_license_score('git@github.com:davglass/license-checker.git').then(
  (data: number) => {
    console.log(data);
  }
);
