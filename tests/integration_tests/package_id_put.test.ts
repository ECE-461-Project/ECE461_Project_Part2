import * as request from 'supertest';
import {get_auth_token} from './helper/get_auth_token';
import {PackageData, PackageMetadata} from '../../src/api_server/models/models'
import {readFileSync} from 'fs';

// This checks if the INTEGRATION env variable is defined
if (process.env.INTEGRATION === undefined) {
  describe = describe.skip;
}

const app = 'localhost:3000';

// Please seed the database in database_seed.ts
// Please put package files in the test_packages directory
const token = get_auth_token();

jest.setTimeout(60000);

describe('PUT /package/id', () => {
  test('No body, 400', async () => {
    const query = {
    };
    const result = await request(app).put('/package/cloudinary').set('X-Authorization', `bearer ${token}`).send(query);
    expect(result.statusCode).toEqual(400);
  });
  
  test('Resource not found 404', async () => {
	const mdata: PackageMetadata = {
	  Name: '0',
	  ID: '0',
	  Version: 'oof',
    };
    const pdata: PackageData = {
	  URL: 'zero',
    };
    const query = {
	  metadata: mdata,
	  data: pdata,
    };
    const result = await request(app).put('/package/0').set('X-Authorization', `bearer ${token}`).send(query);
    expect(result.statusCode).toEqual(404);
  });
  
  test('BOTH input, 400', async () => {
	const mdata: PackageMetadata = {
	  Name: 'zero',
	  ID: 'zero',
	  Version: 'oof',
    };
	const pdata: PackageData = {
	  URL: 'doesntmatter',
	  Content: 'doesntmatter',
	};
    const query = {
	  metadata: mdata,
	  data: pdata,
    };
    const result = await request(app).put('/package/cloudinary')
      .set('X-Authorization', `bearer ${token}`)
      .set('Content-type', 'application/json')
      .send(query);
    expect(result.statusCode).toEqual(400);
  });

  test('Auth failed 400', async () => {
	const mdata: PackageMetadata = {
	  Name: 'zero',
	  ID: 'zero',
	  Version: 'oof',
    };
    const pdata: PackageData = {
	  URL: 'zero',
    };
    const query = {
	  metadata: mdata,
	  data: pdata,
    };
    const result = await request(app).put('/package/cloudinary')
      .set('Content-type', 'application/json')
      .send(query);
    expect(result.statusCode).toEqual(400);
  });
});

	