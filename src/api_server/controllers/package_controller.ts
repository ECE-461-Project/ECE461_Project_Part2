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
import {
  package_rate_compute,
  package_rate_compute_and_update,
  package_rate_ingestible,
  package_rate_update,
} from '../package_rate_helper';
import {SCORE_OUT} from '../../score_calculations';
import {create_tmp, delete_dir} from '../../git_clone';
import {join} from 'path';
import {readFile} from 'fs/promises';

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_ID_GET
 *
 */ ///////////////////////////////////////////////////////////////////////
export async function package_id_get(req: Request, res: Response) {
  //console.log(`GET /package/id ${JSON.stringify(req.params)}`);
  try {
    const result = await packages.findOne({where: {PackageID: req.params.id}});
    if (result) {
      const metadata: PackageMetadata = {
        Name: result.PackageName,
        Version: result.VersionNumber,
        ID: result.PackageID.toString(),
      };
      const data: PackageData = {
        // change to just URL from database result
        URL: result.GitHubLink,
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
    console.log(err);
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
 * 							PACKAGE_POST
 *
 */ ///////////////////////////////////////////////////////////////////////
export async function package_post(req: Request, res: Response) {
  try {
    const input: PackageData = req.body;
    const content = input.Content;
    const url_in = input.URL;
    console.log(content);
    console.log(url_in);
    // we are not implementing the JSProgram
    // @TODO code 409 package exists already
    if (content) {
      // steps: content input is the b64 zip file
      // create temp directory to store package
      const temp_dir = await create_tmp();

      // 1. un-base64 it
      // 2. unzip it into PackagePath (neet to set)
      // 3. look in package.json for Name, Version, URL
      //    and set all PackageMetadata fields (for URL, parse and put the good format in database)
      // if no package.json / no URL / no Name / No Version, return status 400 formed improperly
      // 4.
      // 5. Update database for Name Version ID URL and PackagePath
      // 6. return metadata and content
    } else if (url_in) {
      // steps: url_in input is ingestible public
      // create temp directory to store package
      const temp_dir = await create_tmp();
      // 1. run package rate on the url (make that a separate function not part of req/response)
      const ud: SCORE_OUT = await package_rate_compute(url_in, temp_dir);
      // 2. Check if ingestible
      // 3. If not ingestible, return 424 status due to disqualified rating
      if (package_rate_ingestible(ud) === 0) {
        delete_dir(temp_dir);
        res.status(424).send('Not uploaded due to the disqualified rating');
      } else {
        // 5. If ingestible: look at local clone created by rating call
        // 6. zip it, then base64 it, then return that b64 in content
        const b64_ingestible = await generate_base64_zip_of_dir(
          join(temp_dir, 'package')
        );
        // look in package.json for Name, Version
        //    and set all PackageMetadata fields
        //    if no package.json / no Name / No Version, return status 400 formed improperly
        const package_json = JSON.parse(
          (await readFile(join(temp_dir, 'package', 'package.json'))).toString()
        );
        const name: string | undefined = package_json.name;
        const version: string | undefined = package_json.version;
        if (name === undefined || version === undefined) {
          delete_dir(temp_dir);
          res.status(400).send('Not uploaded due to formed improperly');
        } else {
          const id: string = name.toLowerCase();
          // create database entry for Name Version ID URL RatedAndApproved and PackagePath
          const package_uploaded = await packages.create({
            PackageID: id,
            PackageName: name,
            PackagePath: temp_dir,
            GitHubLink: ud.GitHubLink,
            RatedAndApproved: 1,
            VersionNumber: version,
            UploadDate: Date.now(),
            createdAt: Date.now(),
            FK_UserID: 1, // @TODO proper user id
          });
          // update database for scores
          await package_rate_update(id, ud);
          // return metadata and content
          const metadata: PackageMetadata = {
            Name: name,
            Version: version,
            ID: id,
          };
          const data: PackageData = {
            Content: b64_ingestible,
          };
          const to_send: ModelPackage = {
            metadata: metadata,
            data: data,
          };
          //console.log(to_send);
          res.contentType('application/json').status(201).send(to_send);
        }
      }
    } else {
      res
        .contentType('application/json')
        .status(400)
        .send('PackageData input does not have Content or URL');
    }
    //console.log(query_data);
  } catch (err: any) {
    console.log(err);
    if (err instanceof Error) {
      const error: ModelError = {
        code: 0,
        message: err.message,
      };
      res.contentType('application/json').status(400).send(error);
    } else {
      const error: ModelError = {
        code: 0,
        message: err.toString(),
      };
      res.contentType('application/json').status(400).send(error);
    }
  }
}

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_ID_RATE_GET
 *
 */ ///////////////////////////////////////////////////////////////////////
export async function package_id_rate_get(req: Request, res: Response) {
  try {
    const result = await packages.findOne({where: {PackageID: req.params.id}});
    if (result) {
      const link_input = result.GitHubLink;
      if (link_input === undefined) {
        res.status(404).send('No Github URL for Package ID!');
      } else {
        // call metric computation
        delete_dir(result.PackagePath);
        const ud: SCORE_OUT = await package_rate_compute_and_update(
          req.params.id,
          link_input,
          result.PackagePath
        );
        res.status(200).send(ud.Rating);
      }
    } else {
      //package not found
      res.status(404).send('Package ID not found!');
    }
  } catch (err: any) {
    console.log(err);
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
