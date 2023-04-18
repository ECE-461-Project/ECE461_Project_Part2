import * as request from 'supertest';
import {get_auth_token} from './helper/get_auth_token';

// This checks if the INTEGRATION env variable is defined
if (process.env.INTEGRATION === undefined) {
  describe = describe.skip;
}

const app = 'localhost:3000';

// Please seed the database in database_seed.ts
// Please put package files in the test_packages directory
const token = get_auth_token();
describe('GET /package/{id}/rate ONLY ERRORS', () => {
  test('Resource not found 404', async () => {
    const result = await request(app).get('/package/1/rate').set('X-Authorization', `bearer ${token}`);
    expect(result.statusCode).toEqual(404);
  });
  test('Auth failed 400', async () => {
    const result = await request(app).get('/package/package_a/rate');
    expect(result.statusCode).toEqual(400);
  });
  // Null github link testcase removed -> packages will be rated at upload time
});

/*
    expect(result.body).toEqual({
      NetScore: 0,
      RampUp: 0,
      Correctness: 0,
      BusFactor: 0,
      ResponsiveMaintainer: 0,
      LicenseScore: 0,
      GoodPinningPractice: 0,
      GoodEngineeringProcess: 0,
	});
*/
	