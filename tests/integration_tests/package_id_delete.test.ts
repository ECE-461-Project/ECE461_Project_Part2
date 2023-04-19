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

describe('DELETE /package/{id}', () => {
  test('Resource not found 404', async () => {
    const result = await request(app).delete('/package/0').set('X-Authorization', `bearer ${token}`);
    expect(result.statusCode).toEqual(404);
  });
  test('Auth failed 400', async () => {
    const result = await request(app).delete('/package/package_1');
    expect(result.statusCode).toEqual(400);
  });
  test('Valid resource 200', async () => {
    const result = await request(app).delete('/package/package_1').set('X-Authorization', `bearer ${token}`);
    expect(result.statusCode).toEqual(200);
  });
});
