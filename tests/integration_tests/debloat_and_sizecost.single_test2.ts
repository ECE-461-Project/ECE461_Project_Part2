import * as request from 'supertest';
import {get_auth_token} from './helper/get_auth_token';
import { readFileSync } from 'fs';
import { PackageData, PackageMetadata, SizecostInput } from '../../src/api_server/models/models';
import {sequelize, packages} from '../../src/api_server/db_connector';

// This checks if the INTEGRATION env variable is defined
if (process.env.INTEGRATION === undefined) {
  describe = describe.skip;
}

const app = 'localhost:3000';
jest.setTimeout(60000);

// Please seed the database in database_seed.ts
// Please put package files in the test_packages directory
const token = get_auth_token();
const query_1: PackageData = {
	URL: 'https://github.com/jashkenas/underscore'
};

const package_b_b64 = readFileSync('./tests/integration_tests/test_packages/package_b.zip.b64').toString()

describe('POST /package with debloat comparison, PUT /package/{id} with debloat comparison', () => {
  test('Debloat on POST /package ', async () => {
	// Add FULL package to registry
    let result = (await request(app).post('/package')
      .set('X-Authorization', `bearer ${token}`)
      .set('debloat', '0')
      .set('Content-type', 'application/json')
      .send(query_1));
    expect(result.statusCode).toEqual(201);
    expect(result.body).toHaveProperty('metadata');
    expect(result.body.metadata.Name).toBe('underscore');
    expect(result.body).toHaveProperty('data');
    expect(result.body.data).toHaveProperty('Content');
    // grab encoded Content NOT debloated
    const content1 = (result.body.data.Content).toString();
    // delete from registry
    result = await request(app).delete('/package/underscore').set('X-Authorization', `bearer ${token}`);
    expect(result.statusCode).toEqual(200);
    // Add DEBLOATED package to registry
    result = (await request(app).post('/package')
      .set('X-Authorization', `bearer ${token}`)
      .set('debloat', '1')
      .set('Content-type', 'application/json')
      .send(query_1));
    expect(result.statusCode).toEqual(201);
    expect(result.body).toHaveProperty('metadata');
    expect(result.body.metadata.Name).toBe('underscore');
    expect(result.body).toHaveProperty('data');
    expect(result.body.data).toHaveProperty('Content');
    const content2 = (result.body.data.Content).toString();
    // FULL package encoded string should be longer than debloated package encoded string
    expect(content1.length).toBeGreaterThan(content2.length);
  });
  
  test('Debloat on PUT /package/{id}', async () => {
	// Update underscore (uploaded above)
    const mdata: PackageMetadata = {
	  Name: 'underscore',
	  ID: 'underscore',
	  Version: '1.13.6', // CURRENT underscore version, may change
    };
    const query = {
	  metadata: mdata,
	  data: query_1,
    };
    let result = await request(app).put('/package/underscore')
      .set('X-Authorization', `bearer ${token}`)
      .set('debloat', '0')
      .send(query);
    expect(result.statusCode).toEqual(200);
    // grab encoded Content NOT debloated
    const found_full = await packages.findOne({where: {PackageName: 'underscore'}});
    expect(found_full).toBeDefined;
    if (found_full !== null) {
	    const content1 = (found_full.PackageZipB64).toString();
	    // Update DEBLOATED package to registry
	    result = await request(app).put('/package/underscore')
	      .set('X-Authorization', `bearer ${token}`)
	      .set('debloat', '1')
	      .send(query);
    	expect(result.statusCode).toEqual(200);
    	
	    const found_full2 = await packages.findOne({where: {PackageName: 'underscore'}});
    	expect(found_full2).toBeDefined;
    	if (found_full2 !== null) {
			const content2 = (found_full2.PackageZipB64).toString();
	    	// FULL package encoded string should be longer than debloated package encoded string
	   		 expect(content1.length).toBeGreaterThan(content2.length);
	   	}
	}
  });
});

describe('POST /sizecost', () => {
  test('/sizecost endpoint tests', async () => {
	// NO AUTH, 400
	let name: SizecostInput[] = [{
		Name: 'nodejs-file-downloader'
	}];
	let result = await request(app).post('/sizecost').send(name);
	expect(result.statusCode).toEqual(400);
	
	// NO INPUT, 400
	let empty_name: SizecostInput[] = [];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(empty_name);
	expect(result.statusCode).toEqual(400);
	
	// BAD INPUT, 400
	let num_in = [4];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(num_in);
	expect(result.statusCode).toEqual(400);
	
	// BAD INPUT, 400
	let two_in_one_arr_entry = [{
		Name: 'nodejs-file-downloader',
		Content: package_b_b64,
	}];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(two_in_one_arr_entry);
	expect(result.statusCode).toEqual(400);
	
	// BAD CONTENT INPUT, 400
	let bad_content = [{
		Content: 'flop',
	}];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(bad_content);
	expect(result.statusCode).toEqual(400);
	
	// BAD CONTENT INPUT, 400
	let bad_url = [{
		URL: 'flop',
	}];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(bad_url);
	expect(result.statusCode).toEqual(400);
  });

  
  test('/sizecost test all input types', async () => {
	// nodejs-file-downloader in package_b should be size cost > 0
	// let name = ['nodejs-file-downloader'];
	let name: SizecostInput[] = [{
		Name: 'nodejs-file-downloader'
	}];
	let result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(name);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBeGreaterThan(0);
	const nodejsfiledownloader_size = result.body.size;
	// Try the same exact package but its zipped form, should still be the same
	let content: SizecostInput[] = [{
		Content: package_b_b64
	}];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(content);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBeGreaterThan(0);
	const nodejsfiledownloader_size2 = result.body.size;
	expect(nodejsfiledownloader_size).toBe(nodejsfiledownloader_size2);
	// try the same exact package but its github URL form, should still be the same
	let git_url: SizecostInput[] = [{
		URL: 'https://github.com/ibrod83/nodejs-file-downloader'
	}];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(git_url);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBeGreaterThan(0);
	const nodejsfiledownloader_size3 = result.body.size;
	expect(nodejsfiledownloader_size).toBe(nodejsfiledownloader_size3);
	// try the same exact package but its NPM URL form, should still be the same
	let npm_url: SizecostInput[] = [{
		URL: 'https://www.npmjs.com/package/nodejs-file-downloader'
	}];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(npm_url);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBeGreaterThan(0);
	const nodejsfiledownloader_size4 = result.body.size;
	expect(nodejsfiledownloader_size).toBe(nodejsfiledownloader_size4);
	// Try the same package with all 4 input types in the arr, should still be the same
	let dupl_all_input: SizecostInput[] = [
		{
			URL: 'https://www.npmjs.com/package/nodejs-file-downloader'
		},
		{
			URL: 'https://github.com/ibrod83/nodejs-file-downloader'
		},
		{
			Content: package_b_b64
		},
		{
			Name: 'nodejs-file-downloader'
		}
	];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(dupl_all_input);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBeGreaterThan(0);
	const nodejsfiledownloader_size5 = result.body.size;
	expect(nodejsfiledownloader_size).toBe(nodejsfiledownloader_size5);
	
  });
  
  test('/sizecost test post upload', async () => {
	// now add nodejs-file-downloader
	const query: PackageData = {
	  Content: package_b_b64
	};
    let result = await request(app).post('/package')
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
    expect(result.body.data).toHaveProperty('Content');
    
    // now that nodejs-file-downloader in package_b is uploaded, should be size cost 0
	let name: SizecostInput[] = [{
		Name: 'nodejs-file-downloader'
	}];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(name);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBe(0);
	
	// now that nodejs-file-downloader in package_b is uploaded, 
	// one of its dependencies should be size cost 0
	// let dep_name = ['sanitize-filename'];
	let dep_name: SizecostInput[] = [{
		Name: 'sanitize-filename'
	}];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(dep_name);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBe(0);
	
	// now that nodejs-file-downloader in package_b is uploaded, 
	// ALL of its dependencies should be NET size cost 0
	// let dep_names = ["follow-redirects", "https-proxy-agent","mime-types", "sanitize-filename"];
	let dep_names: SizecostInput[] = [
		{
			Name: 'follow-redirects'
		},
		{
			Name: 'https-proxy-agent'
		},
		{
			Name: 'mime-types'
		},
		{
			Name: 'sanitize-filename'
		}
	];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(dep_names);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBe(0);
  });
  
  test('/sizecost test post DELETE', async () => {
	// now delete nodejs-file-downloader
    let  result = await request(app).delete('/package/byName/nodejs-file-downloader').set('X-Authorization', `bearer ${token}`);
    expect(result.statusCode).toEqual(200);
    
    // now that nodejs-file-downloader in package_b is deleted, should be size cost  > 0
	let name: SizecostInput[] = [{
		Name: 'nodejs-file-downloader'
	}];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(name);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBeGreaterThan(0);
  });

  test('/sizecost 2 pkgs zero shared transitive dependencies', async () => {
	// For packages NOT in database OR in dependencies list, should have net size cost equal to their sum
	// (in the case where they have NO shared transitive dependencies)
	// ik-sample alone:
	let name = [{
		Name: 'ik-sample'
	}];
	let result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(name);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBeGreaterThan(0);
	const p1_size_cost = result.body.size;
	// gm alone:
	name = [{
		Name: 'gm'
	}];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(name);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBeGreaterThan(0);
	const p2_size_cost = result.body.size;
	// ik-sample and gm together:
	let names: SizecostInput[] = [
		{
			Name: 'ik-sample'
		},
		{
			Name: 'gm'
		}
	];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(names);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBeGreaterThan(0);
	let net_size_cost = result.body.size;
	expect(net_size_cost).toBe(p1_size_cost + p2_size_cost);
  });


  test('/sizecost 2 pkgs shared transitive dependencies', async () => {
	// For packages NOT in database OR in dependencies list, should have net size cost LESS THAN to their sum
	// (in the case where they have SOME SHARED transitive dependencies)
	// cloudinary alone:
	let name = [{
		Name: 'cloudinary'
	}];
	let result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(name);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBeGreaterThan(0);
	const cloudinary_size_cost = result.body.size;
	// express alone:
	name = [{
		Name: 'express'
	}];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(name);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBeGreaterThan(0);
	const express_size_cost = result.body.size;
	// cloudinary and express together:
	let names = [
		{
			Name: 'cloudinary'
		},
		{
			Name: 'express'
		}
	];
	result = await request(app).post('/sizecost').set('X-Authorization', `bearer ${token}`).send(names);
	expect(result.statusCode).toEqual(200);
	expect(result.body).toHaveProperty('names');
	expect(result.body).toHaveProperty('size');
	expect(result.body.size).toBeGreaterThan(0);
	let net_size_cost = result.body.size;
	expect(net_size_cost).toBeLessThan(express_size_cost + cloudinary_size_cost);
  });
});
