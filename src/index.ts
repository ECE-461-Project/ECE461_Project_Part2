import {get_license_score} from './license_score_calc/license';

console.log('hello');

get_license_score().then((data: number) => {
  console.log(data);
});
