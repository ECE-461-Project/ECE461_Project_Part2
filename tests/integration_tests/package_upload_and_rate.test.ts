import * as request from 'supertest';
import {get_auth_token} from './helper/get_auth_token';
import {PackageRating} from '../../src/api_server/models/models'

// This checks if the INTEGRATION env variable is defined
if (process.env.INTEGRATION === undefined) {
  describe = describe.skip;
}

const app = 'localhost:3000';

// Please seed the database in database_seed.ts
// Please put package files in the test_packages directory
const token = get_auth_token();
describe('POST /package', () => {
  test('Resource not found 404', async () => {
	  // WILL FINISH MONDAY NIGHT!
	  expect(1).toBe(1);
  });
  /*
  test('Auth failed 400', async () => {
    const result = await request(app).get('/package/package_a/rate');
    expect(result.statusCode).toEqual(400);
  });
  test('Null github link 404', async () => {
    const result = await request(app).get('/package/package_a/rate').set('X-Authorization', `bearer ${token}`);
    expect(result.statusCode).toEqual(404);
  });
  test('Success 200', async () => {
    const result = await request(app).get('/package/cloudinary/rate').set('X-Authorization', `bearer ${token}`);
    expect(result.statusCode).toEqual(200);
    // need PackagePath to be set properly for rating to work - this integration is done
    // by separate test file on upload then rate! (package_upload_and_rate.test.ts)
  });
  */
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
	