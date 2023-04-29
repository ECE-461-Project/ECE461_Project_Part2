import * as request from 'supertest';
import {get_auth_token} from './helper/get_auth_token';

// This checks if the INTEGRATION env variable is defined
if (process.env.INTEGRATION === undefined) {
  describe = describe.skip;
}


const app = 'localhost:3000';
const token = get_auth_token();

describe('POST signup', () => {

  const adminUsername = 'admin_user';
  const adminPassword = 'correcthorsebatterystaple123(!__+@**(A'+"'"+'"`;DROP TABLE packages;';
  
  const newUser = {
    username: 'new_user',
    email: 'new_user@example.com',
    password: 'password123',
    Permissions: {isAdmin: true}
  };

  test('Success 200', async () => {
    const result = (await request(app).post('/signup').set('X-Authorization', `bearer ${token}`).send({
      adminUsername,
      adminPassword,
      newUser
    }));
    expect(result.statusCode).toEqual(200);
  });

  test('Unauthorized 403', async () => {
    const result = (await request(app).post('/signup').send({
      adminUsername,
      adminPassword: 'wrong_password',
      newUser
    }));
    expect(result.statusCode).toEqual(403);
  });

});
