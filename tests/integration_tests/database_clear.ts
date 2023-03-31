import {packages, sequelize} from '../../src/api_server/db_connector';

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
  console.log('Database clear success');
}
//main();
