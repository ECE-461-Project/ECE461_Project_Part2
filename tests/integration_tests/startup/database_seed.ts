import { readFileSync } from 'fs';
import {packages, sequelize} from '../../../src/api_server/db_connector';
// Please seed the database in database_seed.ts
// Please put package files in the test_packages directory

// For reference
/*
export class packages extends Model {
  declare PackageID: number;
  declare PackageName: string;
  declare PackagePath: string;
  declare GitHubLink: string;
  declare RatedAndApproved: number;
  declare VersionNumber: string;
  declare NetScore: number;
  declare BusFactor: number;
  declare Correctness: number;
  declare RampUp: number;
  declare ResponsiveMaintainer: number;
  declare LicenseScore: number;
  declare GoodPinningPractice: number;
  declare GoodEngineeringProcess: number;
  declare UploadDate: Date;
  declare FK_UserID: number;
}
*/
module.exports = async function main() {
  // Delete everything from packages table
  await packages.destroy({
    truncate: true
  });

  // Seed for GET /package/{id}/
  //const {execSync} = require('child_process');
  //console.log('Sleeping... (database_seed.ts)');
  //execSync('sleep 5'); // block process for 1 second.

  const package_a = await packages.create({
	PackageID: 'package_a',
    PackageName: 'package_a',
    PackageZipB64: readFileSync('tests/integration_tests/test_packages/package_a.zip.b64'),
    VersionNumber: '1.0.0',
    UploadDate: Date.now(),
  });
  
  // for rating:
  /*
  const express_package = await packages.create({
	PackageID: 'express',
    PackageName: 'express',
    PackagePath: './tests/integration_tests/test_packages', // not real, just required for db
    GitHubLink: 'https://www.npmjs.com/package/express',
    VersionNumber: '1.0.0', // not real, just required for db
    UploadDate: Date.now(),
  });
  */
  // seeding for DELETE ONLY! just IDs
  const package_1 = await packages.create({
	PackageID: 'package_1',
    PackageName: 'package_1',
    PackageZipB64: 'notreal',
    VersionNumber: '1.0.0',
    UploadDate: Date.now(),
  });
  
  // seeding for DELETE BY NAME ONLY!
  const package_2 = await packages.create({
	PackageID: 'package_2',
    PackageName: 'package_2',
    PackageZipB64: 'notreal',
    VersionNumber: '1.0.0',
    UploadDate: Date.now(),
  });
  console.log('Database seed success');
}
//main();
