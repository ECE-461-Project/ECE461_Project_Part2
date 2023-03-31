import exp = require('constants');
import * as request from 'supertest';

// This checks if the INTEGRATION env variable is defined
if (process.env.INTEGRATION === undefined) {
  describe = describe.skip;
}

const app = 'localhost:3000';

// Please seed the database in database_seed.ts
// Please put package files in the test_packages directory
describe('GET /package/{id}', () => {
  test('Resource not found 404', async () => {
    const result = await request(app).get('/package/0');
    expect(result.statusCode).toEqual(404);
  });
  test.skip('Missing Fields 400', async () => {
    // This test is not implemented
  });
  test('Valid resource 200', async () => {
    const result = await request(app).get('/package/1');
    expect(result.statusCode).toEqual(200);
    expect(result.body.metadata).toEqual({
      Name: 'package_a',
      Version: '1.0.0',
      ID: '1',
    });
    expect(result.body).toHaveProperty('data');
    expect(result.body.data).toHaveProperty('Content');
    // data.Content base64 cannot be validated easily due to 
    //  different file permissions causing base64 to be slightly
    //  different
  });
});
