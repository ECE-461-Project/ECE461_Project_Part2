// You should use models for return
import {Request, Response} from 'express';
import {sequelize, packages} from '../db_connector';
import {
  ModelPackage,
  PackageMetadata,
  PackageData,
  ModelError,
} from '../models/models';
import {generate_base64_zip_of_dir, unzip_base64_to_dir} from '../zip_files';
import {
  package_rate_compute,
  package_rate_compute_and_update,
  package_rate_fetch,
  package_rate_ingestible,
} from '../package_rate_helper';
import {SCORE_OUT} from '../../score_calculations';
import {create_tmp, delete_dir, create_dir} from '../../git_clone';
import {join} from 'path';
import {find_and_read_package_json} from '../get_files';
import {get_url_parse_from_input} from '../../url_parser';

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
      const content_data = result.PackageZipB64;
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
    globalThis.logger?.error(err);
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
 * 							PACKAGE_ID_PUT (update)
 *
 */ ///////////////////////////////////////////////////////////////////////
async function package_id_put_content(
  req: Request,
  res: Response,
  mdata: PackageMetadata,
  pdata: PackageData,
  db_entry: packages,
  content: string
) {
  // steps: content input is the b64 zip file
  // create temp directory to store package
  const temp_dir = await create_tmp();

  // 1. un-base64 it
  // 2. unzip it into PackagePath (neet to set)
  const zip_check = await unzip_base64_to_dir(content, temp_dir);
  if (zip_check === undefined) {
    globalThis.logger?.info('Not updated due to zip input formed improperly');
    delete_dir(temp_dir);
    res.contentType('application/json').status(400).send();
    return;
  }
  // look in package.json for Name, Version
  //    and set all PackageMetadata fields
  //    if no package.json / no Name / No Version, return status 400 formed improperly
  const package_json_str = await find_and_read_package_json(temp_dir);
  if (package_json_str === undefined) {
    globalThis.logger?.info(
      'Package update fail due to package.json problem - input formed improperly'
    );
    delete_dir(temp_dir);
    res.contentType('application/json').status(400).send();
    return;
  }
  const package_json = JSON.parse(package_json_str);
  const name: string | undefined = package_json.name;
  const version: string | undefined = package_json.version;
  let repository_url: string | undefined = package_json.homepage;
  if (repository_url === undefined) {
    repository_url = package_json.repository.url;
  }
  if (
    name === undefined ||
    version === undefined ||
    repository_url === undefined
  ) {
    globalThis.logger?.info(
      'Not updated due to package.json no name version or url! formed improperly'
    );
    delete_dir(temp_dir);
    res.contentType('application/json').status(400).send();
    return;
  }
  // Parse URL
  const real_url = await get_url_parse_from_input(repository_url);
  if (real_url === undefined) {
    globalThis.logger?.info('Not updated due to URL parsing error!');
    delete_dir(temp_dir);
    res.contentType('application/json').status(400).send();
    return;
  }
  globalThis.logger?.debug(`url: ${real_url[0].github_repo_url} `);
  globalThis.logger?.info(
    `Package update Content URL found: ${real_url[0].github_repo_url}`
  );
  const id: string = name.toLowerCase();

  delete_dir(temp_dir);

  if (id !== db_entry.PackageID) {
    globalThis.logger?.info(
      'Not updated due to package.json ID not the same as old ID! formed improperly'
    );
    res.contentType('application/json').status(400).send();
    return;
  }
  if (name !== db_entry.PackageName) {
    globalThis.logger?.info(
      'Not updated due to package.json name not the same as old name! formed improperly'
    );
    res.contentType('application/json').status(400).send();
    return;
  }
  // create database entry for Name Version ID URL RatedAndApproved and PackageData
  const package_updated = await db_entry.update({
    PackageID: id,
    PackageName: name,
    PackageZipB64: content,
    GitHubLink: real_url[0].github_repo_url,
    UploadTypeURL: 0,
    VersionNumber: version,
    updatedAt: Date.now(),
    FK_UserID: res.locals.UserID, // from authenticate, response locals object field set
  });
  if (package_updated) {
    globalThis.logger?.info('Package update success!');
    res.contentType('application/json').status(200).send();
    return;
  }
  globalThis.logger?.info('Failure to update db on update, 400!');
  res.contentType('application/json').status(400).send();
}

async function package_id_put_url(
  req: Request,
  res: Response,
  mdata: PackageMetadata,
  pdata: PackageData,
  db_entry: packages,
  url: string
) {}

export async function package_id_put(req: Request, res: Response) {
  try {
    const input = req.body;
    if (input === undefined) {
      globalThis.logger?.info('Request body null!');
      res.contentType('application/json').status(400).send();
      return;
    }
    const mdata: PackageMetadata | undefined = input.metadata;
    const pdata: PackageData | undefined = input.data;
    if (mdata === undefined || pdata === undefined) {
      globalThis.logger?.info('Request body missing metadata or data!');
      res.contentType('application/json').status(400).send();
      return;
    }
    const id = mdata.ID;
    if (id !== req.params.id) {
      globalThis.logger?.info('Request param id and metadata id do not match!');
      res.contentType('application/json').status(400).send();
      return;
    }
    const result = await packages.findOne({where: {PackageID: req.params.id}});
    if (!result) {
      // could not find package!
      globalThis.logger?.info('Not updated since not found: 404!');
      res.contentType('application/json').status(404).send();
      return;
    }
    if (result.PackageName !== mdata.Name) {
      globalThis.logger?.info(
        'PackageName does not match metadata input: 400!'
      );
      res.contentType('application/json').status(400).send();
      return;
    }
    if (result.VersionNumber !== mdata.Version) {
      globalThis.logger?.info(
        'Version number does not match metadata input: 400!'
      );
      res.contentType('application/json').status(400).send();
      return;
    }
    if (result.PackageID !== mdata.ID) {
      globalThis.logger?.info('PackageID does not match metadata input: 400!');
      res.contentType('application/json').status(400).send();
      return;
    }
    const content: string | undefined = input.Content;
    const url_in: string | undefined = input.URL;
    globalThis.logger?.debug(content);
    globalThis.logger?.debug(url_in);
    // we are not implementing the JSProgram
    if (content !== undefined && url_in !== undefined) {
      globalThis.logger?.info('PackageData input has BOTH url and content!');
      res.contentType('application/json').status(400).send();
      return;
    } else if (content !== undefined) {
      package_id_put_content(req, res, mdata, pdata, result, content);
      return;
    } else if (url_in !== undefined) {
      package_id_put_url(req, res, mdata, pdata, result, url_in);
      return;
    } else {
      globalThis.logger?.info('PackageData input does not have Content or URL');
      res.contentType('application/json').status(400).send();
      return;
    }
    //console.log(query_data);
  } catch (err: any) {
    globalThis.logger?.error(err);
    if (err instanceof Error) {
      const error: ModelError = {
        code: 0,
        message: err.message,
      };
      res.contentType('application/json').status(400).send(error);
      return;
    } else {
      const error: ModelError = {
        code: 0,
        message: err.toString(),
      };
      res.contentType('application/json').status(400).send(error);
      return;
    }
  }
}

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_ID_DELETE
 *
 */ ///////////////////////////////////////////////////////////////////////
export async function package_id_delete(req: Request, res: Response) {
  try {
    const result = await packages.findOne({where: {PackageID: req.params.id}});
    if (result) {
      // don't need to do anything except clear database entry
      // directory of package always deleted on upload/rate!
      const del = await packages.destroy({where: {PackageID: req.params.id}});
      if (del) {
        globalThis.logger?.info('Success deleting ... 200!');
        res.contentType('application/json').status(200).send();
        return;
      } else {
        globalThis.logger?.info('Error deleting ... 400!');
        res.contentType('application/json').status(400).send();
        return;
      }
    } else {
      globalThis.logger?.info('Not deleted since not found: 404!');
      res.contentType('application/json').status(404).send();
      return;
    }
  } catch (err: any) {
    globalThis.logger?.error(err);
    if (err instanceof Error) {
      const error: ModelError = {
        code: 0,
        message: err.message,
      };
      res.contentType('application/json').status(400).send(error);
      return;
    } else {
      const error: ModelError = {
        code: 0,
        message: err.toString(),
      };
      res.contentType('application/json').status(400).send(error);
      return;
    }
  }
}

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_POST
 *
 */ ///////////////////////////////////////////////////////////////////////
async function package_post_content(
  req: Request,
  res: Response,
  input: PackageData,
  content: string
) {
  // steps: content input is the b64 zip file
  // create temp directory to store package
  const temp_dir = await create_tmp();

  // 1. un-base64 it
  // 2. unzip it into PackagePath (neet to set)
  const zip_check = await unzip_base64_to_dir(content, temp_dir);
  if (zip_check === undefined) {
    globalThis.logger?.info('Not uploaded due to zip input formed improperly');
    delete_dir(temp_dir);
    res.contentType('application/json').status(400).send();
    return;
  }
  // look in package.json for Name, Version
  //    and set all PackageMetadata fields
  //    if no package.json / no Name / No Version, return status 400 formed improperly
  const package_json_str = await find_and_read_package_json(temp_dir);
  if (package_json_str === undefined) {
    globalThis.logger?.info(
      'Package upload fail due to package.json problem - input formed improperly'
    );
    delete_dir(temp_dir);
    res.contentType('application/json').status(400).send();
    return;
  }
  const package_json = JSON.parse(package_json_str);
  const name: string | undefined = package_json.name;
  const version: string | undefined = package_json.version;
  let repository_url: string | undefined = package_json.homepage;
  if (repository_url === undefined) {
    repository_url = package_json.repository.url;
  }
  if (
    name === undefined ||
    version === undefined ||
    repository_url === undefined
  ) {
    globalThis.logger?.info(
      'Not uploaded due to package.json no name version or url! formed improperly'
    );
    delete_dir(temp_dir);
    res.contentType('application/json').status(400).send();
    return;
  }
  globalThis.logger?.info(
    `Package upload Content URL found: ${repository_url}`
  );
  const id: string = name.toLowerCase();
  // check if id exists already, error 409
  const result = await packages.findOne({
    where: {PackageID: id},
  });
  if (result) {
    globalThis.logger?.info('Not uploaded - package exists!');
    delete_dir(temp_dir);
    res.contentType('application/json').status(409).send();
    return;
  }
  const ud: SCORE_OUT = await package_rate_compute(repository_url, temp_dir);

  delete_dir(temp_dir);

  // create database entry for Name Version ID URL RatedAndApproved and PackageData
  const package_uploaded = await packages.create({
    PackageID: id,
    PackageName: name,
    PackageZipB64: content,
    GitHubLink: ud.GitHubLink,
    RatedAndApproved: 1,
    UploadTypeURL: 0,
    VersionNumber: version,
    UploadDate: Date.now(),
    createdAt: Date.now(),
    FK_UserID: res.locals.UserID, // from authenticate, response locals object field set
    NetScore: ud.Rating.NetScore,
    BusFactor: ud.Rating.BusFactor,
    Correctness: ud.Rating.Correctness,
    RampUp: ud.Rating.RampUp,
    ResponsiveMaintainer: ud.Rating.ResponsiveMaintainer,
    LicenseScore: ud.Rating.LicenseScore,
    GoodPinningPractice: ud.Rating.GoodPinningPractice,
    GoodEngineeringProcess: ud.Rating.GoodEngineeringProcess,
  });

  const metadata: PackageMetadata = {
    Name: name,
    Version: version,
    ID: id,
  };
  const data: PackageData = {
    URL: ud.GitHubLink,
  };
  const to_send: ModelPackage = {
    metadata: metadata,
    data: data,
  };
  //console.log(to_send);
  res.contentType('application/json').status(201).send(to_send);
}

async function package_post_url(
  req: Request,
  res: Response,
  input: PackageData,
  url_in: string
) {
  // steps: url_in input is ingestible public
  // create temp directory to store package
  const temp_dir = await create_tmp();
  // 1. run package rate on the url (make that a separate function not part of req/response)
  const ud: SCORE_OUT = await package_rate_compute(url_in, temp_dir);
  // 2. Check if ingestible
  // 3. If not ingestible, return 424 status due to disqualified rating
  if (package_rate_ingestible(ud) === 0) {
    globalThis.logger?.info('Not uploaded due to the disqualified rating');
    delete_dir(temp_dir);
    res.contentType('application/json').status(424).send();
    return;
  }
  // look in package.json for Name, Version
  //    and set all PackageMetadata fields
  //    if no package.json / no Name / No Version, return status 400 formed improperly
  const package_json_str = await find_and_read_package_json(temp_dir);
  if (package_json_str === undefined) {
    globalThis.logger?.info(
      'Package upload fail due to package.json problem - input formed improperly'
    );
    delete_dir(temp_dir);
    res.contentType('application/json').status(400).send();
    return;
  }
  const package_json = JSON.parse(package_json_str);
  const name: string | undefined = package_json.name;
  const version: string | undefined = package_json.version;
  if (name === undefined || version === undefined) {
    globalThis.logger?.info(
      'Not uploaded due to name or version in package.json @ url input formed improperly'
    );
    delete_dir(temp_dir);
    res.contentType('application/json').status(400).send();
    return;
  }
  const id: string = name.toLowerCase();
  // check if id exists already, error 409
  const result = await packages.findOne({
    where: {PackageID: id},
  });
  if (result) {
    globalThis.logger?.info('Not uploaded - package exists!');
    delete_dir(temp_dir);
    res.contentType('application/json').status(409).send();
    return;
  }
  // 5. If ingestible: look at local clone created by rating call
  // 6. zip it, then base64 it, then return that b64 in content
  const b64_ingestible = await generate_base64_zip_of_dir(
    join(temp_dir, 'package'),
    join(temp_dir, 'package'),
    id
  );
  // create database entry for Name Version ID URL RatedAndApproved
  const package_uploaded = await packages.create({
    PackageID: id,
    PackageName: name,
    PackageZipB64: b64_ingestible,
    GitHubLink: ud.GitHubLink,
    RatedAndApproved: 1,
    UploadTypeURL: 1,
    VersionNumber: version,
    UploadDate: Date.now(),
    createdAt: Date.now(),
    FK_UserID: res.locals.UserID, // from authenticate, response locals object field set
    NetScore: ud.Rating.NetScore,
    BusFactor: ud.Rating.BusFactor,
    Correctness: ud.Rating.Correctness,
    RampUp: ud.Rating.RampUp,
    ResponsiveMaintainer: ud.Rating.ResponsiveMaintainer,
    LicenseScore: ud.Rating.LicenseScore,
    GoodPinningPractice: ud.Rating.GoodPinningPractice,
    GoodEngineeringProcess: ud.Rating.GoodEngineeringProcess,
  });

  delete_dir(temp_dir);
  // Response
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

export async function package_post(req: Request, res: Response) {
  try {
    const input: PackageData = req.body;
    const content: string | undefined = input.Content;
    const url_in: string | undefined = input.URL;
    globalThis.logger?.debug(content);
    globalThis.logger?.debug(url_in);
    // we are not implementing the JSProgram
    if (content !== undefined && url_in !== undefined) {
      globalThis.logger?.info('PackageData input has BOTH url and content!');
      res.contentType('application/json').status(400).send();
    } else if (content !== undefined) {
      package_post_content(req, res, input, content);
    } else if (url_in !== undefined) {
      package_post_url(req, res, input, url_in);
    } else {
      globalThis.logger?.info('PackageData input does not have Content or URL');
      res.contentType('application/json').status(400).send();
    }
  } catch (err: any) {
    globalThis.logger?.error(err);
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
  let temp_dir = '';
  try {
    const result = await packages.findOne({where: {PackageID: req.params.id}});
    if (result) {
      temp_dir = await create_tmp();
      const ud = await package_rate_compute_and_update(
        req.params.id,
        result.GitHubLink,
        temp_dir
      );
      delete_dir(temp_dir);
      if (ud) {
        res.contentType('application/json').status(200).send(ud.Rating);
      } else {
        globalThis.logger?.error(
          'Package Rating for valid package failed to fetch'
        );
        const error: ModelError = {
          code: 0,
          message: 'Package Rating Failed!',
        };
        res.contentType('application/json').status(500).send(error);
      }
    } else {
      //package not found
      globalThis.logger?.info('Package ID not found!');
      res.contentType('application/json').status(404).send();
    }
  } catch (err: any) {
    delete_dir(temp_dir);
    globalThis.logger?.error(err);
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
  // Since dealing with traceability, we are not implementing, piazza confirmed
  res.status(200).send('This is wrong response btw');
}

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_BYNAME_NAME_DELETE
 *
 */ ///////////////////////////////////////////////////////////////////////
export function package_byName_name_delete(req: Request, res: Response) {
  // since dealing with by name, unsure if need to implement, asked on piazza
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
