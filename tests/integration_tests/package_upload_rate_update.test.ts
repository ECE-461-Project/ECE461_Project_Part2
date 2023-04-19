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

describe('POST /package', () => {

  test('No input, 400', async () => {
	const query: PackageData = {
	};
    const result = await request(app).post('/package')
      .set('X-Authorization', `bearer ${token}`)
      .set('Content-type', 'application/json')
      .send(query);
    expect(result.statusCode).toEqual(400);
  });
  
  test('BOTH input, 400', async () => {
	const query: PackageData = {
	  URL: 'doesntmatter',
	  Content: 'doesntmatter',
	};
    const result = await request(app).post('/package')
      .set('X-Authorization', `bearer ${token}`)
      .set('Content-type', 'application/json')
      .send(query);
    expect(result.statusCode).toEqual(400);
  });

  test('Auth failed 400', async () => {
	const query: PackageData = {
	  URL: 'https://github.com/cloudinary/cloudinary_npm'
	};
    const result = await request(app).post('/package')
      .set('Content-type', 'application/json')
      .send(query);
    expect(result.statusCode).toEqual(400);
  });

  test('Successful 201 ingestible URL', async () => {
	const query: PackageData = {
	  URL: 'https://github.com/cloudinary/cloudinary_npm'
	};
    const result = await request(app).post('/package')
      .set('X-Authorization', `bearer ${token}`)
      .set('Content-type', 'application/json')
      .send(query);
    expect(result.statusCode).toEqual(201);
    expect(result.body).toHaveProperty('metadata');
    expect(result.body.metadata).toHaveProperty('Name');
    expect(result.body.metadata.Name).toBe('cloudinary');
    expect(result.body.metadata).toHaveProperty('Version');
    expect(result.body.metadata).toHaveProperty('ID');
    expect(result.body).toHaveProperty('data');
    expect(result.body.data).toHaveProperty('Content');
  });

  test('Duplicate url package 409', async () => {
	const query: PackageData = {
	  URL: 'https://github.com/cloudinary/cloudinary_npm'
	};
    const result = await request(app).post('/package')
      .set('X-Authorization', `bearer ${token}`)
      .set('Content-type', 'application/json')
      .send(query);
    expect(result.statusCode).toEqual(409);
  });

  test('Duplicate zip input package 409 package_a', async () => {
	const package_a_b64 = readFileSync('./tests/integration_tests/test_packages/package_a.zip.b64').toString()
	const query: PackageData = {
	  Content: package_a_b64
	};
    const result = await request(app).post('/package')
      .set('X-Authorization', `bearer ${token}`)
      .set('Content-type', 'application/json')
      .send(query);
    expect(result.statusCode).toEqual(409);
  });

  test('Successful 201 zip input package_b', async () => {
	const package_b_b64 = readFileSync('./tests/integration_tests/test_packages/package_b.zip.b64').toString()
	const query: PackageData = {
	  Content: package_b_b64
	};
    const result = await request(app).post('/package')
      .set('X-Authorization', `bearer ${token}`)
      .set('Content-type', 'application/json')
      .send(query);
    expect(result.statusCode).toEqual(201);
    expect(result.body).toHaveProperty('metadata');
    expect(result.body.metadata).toHaveProperty('Name');
    expect(result.body.metadata.Name).toBe('nodejs-file-downloader')
    expect(result.body.metadata).toHaveProperty('Version');
    expect(result.body.metadata).toHaveProperty('ID');
    expect(result.body).toHaveProperty('data');
    expect(result.body.data).toHaveProperty('URL');
  });

  test('RATE cloudinary post-upload 200', async () => {
    const result = await request(app).get('/package/cloudinary/rate').set('X-Authorization', `bearer ${token}`);
    expect(result.statusCode).toEqual(200);
    expect(result.body).toHaveProperty('BusFactor');
    expect(result.body).toHaveProperty('Correctness');
    expect(result.body).toHaveProperty('GoodEngineeringProcess');
    expect(result.body).toHaveProperty('GoodPinningPractice');
    expect(result.body).toHaveProperty('LicenseScore');
    expect(result.body).toHaveProperty('NetScore');
    expect(result.body).toHaveProperty('RampUp');
    expect(result.body).toHaveProperty('ResponsiveMaintainer');
  });
  
  test('UPDATE package_b post-upload with URL 200', async () => {
    const mdata: PackageMetadata = {
	  Name: 'nodejs-file-downloader',
	  ID: 'nodejs-file-downloader',
	  Version: '4.11.0',
    };
    const pdata: PackageData = {
	  URL: 'https://github.com/ibrod83/nodejs-file-downloader',
    };
    const query = {
	  metadata: mdata,
	  data: pdata,
    };
    const result = await request(app).put('/package/nodejs-file-downloader').set('X-Authorization', `bearer ${token}`).send(query);
    expect(result.statusCode).toEqual(200);
  });
  
  test('UPDATE package_b post-upload with CONTENT 200', async () => {
	const package_b_update_b64 = readFileSync('./tests/integration_tests/test_packages/package_b_update.zip.b64').toString()

    const mdata: PackageMetadata = {
	  Name: 'nodejs-file-downloader',
	  ID: 'nodejs-file-downloader',
	  Version: '4.11.1', // whatever the current one in npm registry is (WILL NEED TO CHANGE!)
    };
    const pdata: PackageData = {
	  Content: package_b_update_b64,
    };
    const query = {
	  metadata: mdata,
	  data: pdata,
    };
    const result = await request(app).put('/package/nodejs-file-downloader').set('X-Authorization', `bearer ${token}`).send(query);
    expect(result.statusCode).toEqual(200);
  });
  
  
  test('UPDATE package_b post-upload with MISMATCH VERSION 400', async () => {
	const package_b_update_b64 = readFileSync('./tests/integration_tests/test_packages/package_b_update.zip.b64').toString()

    const mdata: PackageMetadata = {
	  Name: 'nodejs-file-downloader',
	  ID: 'nodejs-file-downloader',
	  Version: '4.11.23',
    };
    const pdata: PackageData = {
	  Content: package_b_update_b64,
    };
    const query = {
	  metadata: mdata,
	  data: pdata,
    };
    const result = await request(app).put('/package/nodejs-file-downloader').set('X-Authorization', `bearer ${token}`).send(query);
    expect(result.statusCode).toEqual(400);
  });
  
  test('UPDATE package_b post-upload with MISMATCH NAME 400', async () => {
	const package_b_update_b64 = readFileSync('./tests/integration_tests/test_packages/package_b_update.zip.b64').toString()

    const mdata: PackageMetadata = {
	  Name: 'nodejs-file-downloadER', // only diff
	  ID: 'nodejs-file-downloader',
	  Version: '4.11.23',
    };
    const pdata: PackageData = {
	  Content: package_b_update_b64,
    };
    const query = {
	  metadata: mdata,
	  data: pdata,
    };
    const result = await request(app).put('/package/nodejs-file-downloader').set('X-Authorization', `bearer ${token}`).send(query);
    expect(result.statusCode).toEqual(400);
  });
});

	