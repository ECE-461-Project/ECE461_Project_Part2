// You should use models for return
import {Request, Response} from 'express';
import {pool} from '../db_connector';
import {
  ModelPackage,
  PackageMetadata,
  PackageData,
  ModelError,
} from '../models/models';
import {generate_base64_zip_of_dir} from '../zip_files';

// This is the interface for a select * from the packages database
// NOTE: The query returns an array!
interface PackagesQuery {
  PackageID: number;
  PackageName: string;
  PackagePath: string;
  GitHubLink: string | undefined;
  VersionNumber: string;
  NetScore: number;
  BusFactorScore: number;
  CorrectnessScore: number;
  LicenseScore: number;
  RampUpScore: number;
  ResponsivenessScore: number;
  GoodPinningPracticeScore: number;
  PullRequestScore: number;
  UploadDate: Date;
  FK_UserID: number;
}

export async function package_id_get(req: Request, res: Response) {
  //console.log(`GET /package/id ${JSON.stringify(req.params)}`);
  let conn;
  try {
    // CHECK AUTH -> response code 400 if failure!
    // TODO

    conn = await pool.getConnection();
    await conn.query('USE custom_repository');
    const query_data: PackagesQuery[] = await conn.query(
      `SELECT * FROM packages WHERE PackageID='${req.params.id}'`
    );
    //console.log(query_data);
    if (query_data.length !== 0) {
      const content_data = await generate_base64_zip_of_dir(
        query_data[0].PackagePath
      );
      const metadata: PackageMetadata = {
        Name: query_data[0].PackageName,
        Version: query_data[0].VersionNumber,
        ID: query_data[0].PackageID.toString(),
      };
      const data: PackageData = {
        Content: content_data,
      };
      const to_send: ModelPackage = {
        metadata: metadata,
        data: data,
      };
      //console.log(to_send);
      res.contentType('application/json').status(200).send(to_send);
    } else {
      res.contentType('application/json').status(404).send();
    }
  } catch (err: any) {
    if (err instanceof Error) {
      const error: ModelError = {
        code: 0,
        message: err.message,
      };
      res.contentType('application/json').status(500).send(error);
    } else {
      const error: ModelError = {
        code: 0,
        message: err.toString(),
      };
      res.contentType('application/json').status(500).send(error);
    }
  } finally {
    if (conn) {
      conn.release(); //release to pool
      //conn.end();
    }
  }
}
export function package_id_put(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}
export function package_id_delete(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}
export function package_post(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}
export function package_id_rate_get(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw. rate');
}
export function package_byName_name_get(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}
export function package_byName_name_delete(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}
export function package_byRegEx_regex_post(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}
