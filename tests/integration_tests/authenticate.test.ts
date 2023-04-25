import * as request from 'supertest';

// This checks if the INTEGRATION env variable is defined
if (process.env.INTEGRATION === undefined) {
  describe = describe.skip;
}

const app = 'localhost:3000';

// ece30861defaultadminuser	correcthorsebatterystaple123(!__+@**(A’”`;DROP TABLE packages;
const password = 'correcthorsebatterystaple123(!__+@**(A'+"'"+'"`;DROP TABLE packages;';

const request_body = {
    User: {
        name: 'ece30861defaultadminuser',
        isAdmin: true,
    },
    Secret: {
        password: password, 
    },
}
const request_body_wrong_user = {
    User: {
        name: 'not_a_user',
        isAdmin: true,
    },
    Secret: {
        password: password,
    },
}
const request_body_wrong_password = {
    User: {
        name: 'ece30861defaultadminuser',
        isAdmin: true,
    },
    Secret: {
        password: 'password_wrong',
    },
}
describe('PUT authenticate', () => {
  test('Success 200', async () => {
    const result = (await request(app).put('/authenticate').send(request_body));
    expect(result.statusCode).toEqual(200);
    const token = result.text;
    const result2 = await request(app).get('/package/0').set('X-Authorization', token);
    expect(result2.statusCode).toEqual(404);
  });
  test('Missing fields 400', async () => {
    const result = (await request(app).put('/authenticate').send({}));
    expect(result.statusCode).toEqual(400);
  });
  test('Invalid username 401', async () => {
    const result = (await request(app).put('/authenticate').send(request_body_wrong_user));
    expect(result.statusCode).toEqual(401);
  });
  test('Invalid password 401', async () => {
    const result = (await request(app).put('/authenticate').send(request_body_wrong_password));
    expect(result.statusCode).toEqual(401);
  });
});
