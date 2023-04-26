import * as request from 'supertest';
import {get_auth_token} from './helper/get_auth_token';
import { readFileSync } from 'fs';

// This checks if the INTEGRATION env variable is defined
if (process.env.INTEGRATION === undefined) {
  describe = describe.skip;
}

const app = 'localhost:3000';

// Please seed the database in database_seed.ts
// Please put package files in the test_packages directory
const token = get_auth_token();
const request_body = {
    User: {
        name: 'non_admin',
        isAdmin: false,
    },
    Secret: {
        password: '1234', 
    },
}

describe('DELETE /reset', () => {
  test('Auth failed 400', async () => {
    const result = await request(app).delete('/reset');
    expect(result.statusCode).toEqual(400);
  });
  test('Valid but not admin', async () => {
    let result = (await request(app).put('/authenticate').send(request_body));
    expect(result.statusCode).toEqual(200);
    const non_admin_token = result.text;
    result = await request(app).delete('/reset').set('X-Authorization', non_admin_token);
    expect(result.statusCode).toEqual(401);
    result = await request(app).get('/package/package_a').set('X-Authorization', `bearer ${token}`);
    expect(result.statusCode).toEqual(200);
    expect(result.body.metadata).toEqual({
      Name: 'package_a',
      Version: '1.0.0',
      ID: 'package_a',
    });
    expect(result.body).toHaveProperty('data');
    expect(result.body.data).toHaveProperty('Content');
    expect(result.body.data.Content).toBe(readFileSync('tests/integration_tests/test_packages/package_a.zip.b64').toString());
  });
  test('Valid and is admin', async () => {
    let result = await request(app).delete('/reset').set('X-Authorization', `bearer ${token}`);
    expect(result.statusCode).toEqual(200);
    result = await request(app).get('/package/0').set('X-Authorization', `bearer ${token}`);
    expect(result.statusCode).toEqual(404);
  });
});
