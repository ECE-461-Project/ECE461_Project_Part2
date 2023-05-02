import * as request from 'supertest';
import {get_auth_token} from './helper/get_auth_token';
import { users } from "../../src/api_server/db_connector";

// This checks if the INTEGRATION env variable is defined
if (process.env.INTEGRATION === undefined) {
  describe = describe.skip;
}

const app = 'localhost:3000';
const token = get_auth_token();

describe('POST signup', () => {

  const adminUsername = 'ece30861defaultadminuser';
  const adminPassword = 'correcthorsebatterystaple123(!__+@**(A'+"'"+'"`;DROP TABLE packages;';
  
  const newUser = {
    Username: 'new_user',
    UserPassword: 'password123',
    Permissions: {isAdmin: true, upload: true, search: true, download: true}
  };

  test('Success 200', async () => {
    const result = (await request(app).post('/user/signup').set('X-Authorization', `bearer ${token}`).send({
      adminUsername,
      adminPassword,
      newUser
    }));
    expect(result.statusCode).toEqual(200);
  });



  test('Unauthorized 403', async () => {
    const result = (await request(app).post('/user/signup').set('X-Authorization', `bearer ${token}`).send({
      adminUsername,
      adminPassword: 'wrong_password',
      newUser
    }));
    expect(result.statusCode).toEqual(400);
  });
});



describe('POST updateUser', () => {
    const adminUsername = 'ece30861defaultadminuser';
    const adminPassword = 'correcthorsebatterystaple123(!__+@**(A'+"'"+'"`;DROP TABLE packages;';
  

    const userId = 1;
    const updatedUserData = {
      Password: 'Iamafool',
    };
  
    test('Success 200', async () => {
      const result = await request(app).post('/user/updateUser').set('X-Authorization', `bearer ${token}`).send({
          adminUsername,
          adminPassword,
          userId,
          updatedUserData,
        });
      expect(result.statusCode).toEqual(200);
    });
  
    test('Unauthorized 400', async () => {
      const result = await request(app)
        .post('/user/updateUser')
        .set('X-Authorization', `bearer ${token}`)
        .send({
          adminUsername,
          adminPassword: 'wrong_password',
          userId,
          updatedUserData,
        });
      expect(result.statusCode).toEqual(400);
    });
  
    test('User not found 400', async () => {
      const result = await request(app)
        .post('/user/updateUser')
        .set('X-Authorization', `bearer ${token}`)
        .send({
          adminUsername,
          adminPassword,
          userId: 999,
          updatedUserData,
        });
      expect(result.statusCode).toEqual(400);
    });
  
    test('Invalid request 400', async () => {
      const result = await request(app)
        .post('/user/updateUser')
        .set('X-Authorization', `bearer ${token}`)
        .send({
          adminUsername,
          adminPassword,
          userId,
          updatedUserData: { invalidField: 'invalidValue' },
        });
      expect(result.statusCode).toEqual(400);

    });
  });



  describe('DELETE user', () => {
    const adminUsername = 'ece30861defaultadminuser';
    const adminPassword = 'correcthorsebatterystaple123(!__+@**(A' + "'" + '"`;DROP TABLE packages;';
  
    // You may need to add a test user for this test suite and clean up after each test.
    const testUser = {
      Username: 'test_user',
      UserPassword: 'test_password',
      Permissions: { isAdmin: false }
    };
  
    test('Success 200', async () => {

    await users.create(testUser);
    
    const result = await request(app)
        .post('/user/deleteUser')
        .set('X-Authorization', `bearer ${token}`)
        .send({ username: testUser.Username, password: testUser.UserPassword });
  
      expect(result.statusCode).toEqual(200);
      expect(result.body).toEqual({ message: 'User deleted successfully' });
    });
  
    test('Unauthorized 400', async () => {
      const result = await request(app)
        .post('/user/deleteUser')
        .set('X-Authorization', `bearer ${token}`)
        .send({ username: testUser.Username, password: 'wrong_password' });
  
      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual({ message: 'Unauthorized' });
    });
  
    test('User not found 400', async () => {
      const result = await request(app)
        .post('/user/deleteUser')
        .set('X-Authorization', `bearer ${token}`)
        .send({ username: 'nonexistent_user', password: adminPassword });
  
      expect(result.statusCode).toEqual(400);
    });
  
  });
  
