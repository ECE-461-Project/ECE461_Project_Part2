// You should use models for return
import {Request, Response} from 'express';
import {sequelize, packages} from '../db_connector';
import {
  ModelPackage,
  PackageMetadata,
  PackageData,
  ModelError,
} from '../models/models';
import {generate_base64_zip_of_dir} from '../zip_files';
import {get_scores_from_url, SCORE_OUT} from '../../score_calculations';

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_ID_GET
 *
 */ ///////////////////////////////////////////////////////////////////////
export async function package_id_get(req: Request, res: Response) {
  //console.log(`GET /package/id ${JSON.stringify(req.params)}`);
  try {
    // CHECK AUTH -> response code 400 if failure!
    // TODO

    const result = await packages.findOne({where: {PackageID: req.params.id}});
    if (result) {
      const content_data = await generate_base64_zip_of_dir(result.PackagePath);
      const metadata: PackageMetadata = {
        Name: result.PackageName,
        Version: result.VersionNumber,
        ID: result.PackageID.toString(),
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
    //console.log(query_data);
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
  }
}

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_ID_PUT
 *
 */ ///////////////////////////////////////////////////////////////////////
export function package_id_put(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_ID_DELETE
 *
 */ ///////////////////////////////////////////////////////////////////////
export function package_id_delete(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_ID_POST
 *
 */ ///////////////////////////////////////////////////////////////////////
export function package_post(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_ID_RATE_GET
 *
 */ ///////////////////////////////////////////////////////////////////////
export async function package_id_rate_get(req: Request, res: Response) {
  try {
    // CHECK AUTH -> response code 400 if failure!
    // TODO once user creation / auth token complete
    const result = await packages.findOne({where: {PackageID: req.params.id}});
    if (result) {
      const link_input = result.GitHubLink;
      if (link_input === undefined) {
        res.status(404).send('No Github URL for Package ID!');
      } else {
        // call metric computation
        const ud: SCORE_OUT = await get_scores_from_url(link_input);
        // write metrics values back into database
        await packages.update(
          {
            NetScore: ud.Rating.NetScore,
            BusFactor: ud.Rating.BusFactor,
            Correctness: ud.Rating.Correctness,
            RampUp: ud.Rating.RampUp,
            ResponsiveMaintainer: ud.Rating.ResponsiveMaintainer,
            LicenseScore: ud.Rating.LicenseScore,
            GoodPinningPractice: ud.Rating.GoodPinningPractice,
            GoodEngineeringProcess: ud.Rating.GoodEngineeringProcess,
          },
          {
            where: {
              PackageID: req.params.id,
            },
          }
        );
        res.status(200).send(ud.Rating);
      }
    } else {
      //package not found
      res.status(404).send('Package ID not found!');
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
  }
}

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_BYNAME_NAME_GET
 *
 */ ///////////////////////////////////////////////////////////////////////
export function package_byName_name_get(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_BYNAME_NAME_DELETE
 *
 */ ///////////////////////////////////////////////////////////////////////
export function package_byName_name_delete(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_BYREGEX_REGEX_POST
 *
 */ ///////////////////////////////////////////////////////////////////////
export function package_byRegEx_regex_post(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}
