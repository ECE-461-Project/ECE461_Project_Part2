// You should use models for return
import {Request, Response} from 'express';
import {sequelize, packages} from '../db_connector';
import {
  ModelPackage,
  PackageMetadata,
  PackageData,
  Debloat,
} from '../models/models';
import {generate_base64_zip_of_dir, unzip_base64_to_dir} from '../zip_files';
import {
  package_rate_compute,
  package_rate_compute_and_update,
  package_rate_ingestible,
} from '../package_rate_helper';
import {SCORE_OUT} from '../../score_calculations';
import {create_tmp, delete_dir, create_dir, git_clone} from '../../git_clone';
import {join} from 'path';
import {find_and_read_package_json, find_and_read_readme} from '../get_files';
import {get_url_parse_from_input} from '../../url_parser';
import {
  npm_compute_optional_update_package_name,
  npm_compute_optional_update_directory,
} from './sizecost_controller';

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
    globalThis.logger?.error(`Error in package_id_get: ${err}`);
    res.status(400).send();
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
  content: string,
  debloat: Debloat
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
  const readme_str = await find_and_read_readme(temp_dir);
  if (readme_str === null) {
    globalThis.logger?.info('Could not find README in package update! Null');
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
  const id: string = name.replace(/[\W]/g, '-').toLowerCase();

  if (debloat === 1) {
    content = await generate_base64_zip_of_dir(
      join(temp_dir, ''),
      join(temp_dir, ''),
      id,
      debloat
    );
  }

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
  globalThis.logger?.debug(`version to be updated: ${version} `);

  // create database entry for Name Version ID URL RatedAndApproved and PackageData
  const package_updated = await db_entry.update({
    PackageID: id,
    PackageName: name,
    PackageZipB64: content,
    GitHubLink: real_url[0].github_repo_url,
    ReadmeContent: readme_str,
    UploadTypeURL: 0,
    VersionNumber: version,
    updatedAt: Date.now(),
    FK_UserID: res.locals.UserID, // from authenticate, response locals object field set
  });
  if (package_updated) {
    // update dependencies for size cost
    const size_cost = await npm_compute_optional_update_directory(
      join(zip_check, ''),
      true,
      false,
      false
    );
    if (size_cost === -1) {
      globalThis.logger?.info('Error on size cost update in UPDATE content');
    }

    delete_dir(temp_dir);
    globalThis.logger?.info('Package update success!');
    res.contentType('application/json').status(200).send();
    return;
  }
  delete_dir(temp_dir);

  globalThis.logger?.info('Failure to update db on update, 400!');
  res.contentType('application/json').status(400).send();
}

async function package_id_put_url(
  req: Request,
  res: Response,
  mdata: PackageMetadata,
  pdata: PackageData,
  db_entry: packages,
  url_in: string,
  debloat: Debloat
) {
  const temp_dir = await create_tmp();
  // parse the url
  const real_url = await get_url_parse_from_input(url_in);
  if (real_url === undefined) {
    globalThis.logger?.info('Not updated due to URL parsing error!');
    delete_dir(temp_dir);
    res.contentType('application/json').status(400).send();
    return;
  }
  globalThis.logger?.debug(`url: ${real_url[0].github_repo_url} `);
  const git_url = real_url[0].github_repo_url;
  // clone the url
  const check_clone = await git_clone(temp_dir, git_url);
  if (check_clone === false) {
    globalThis.logger?.info(
      'Package update fail due to URL cloning issue - input formed improperly'
    );
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
  // find readme, nulll if not
  const readme_str = await find_and_read_readme(temp_dir);
  if (readme_str === null) {
    globalThis.logger?.info('Could not find README in package update! Null');
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
  const id: string = name.replace(/[\W]/g, '-').toLowerCase();
  globalThis.logger?.debug(`version to be updated: ${version} `);

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

  // 6. zip it, then base64 it, then return that b64 in content
  const b64_ingestible = await generate_base64_zip_of_dir(
    join(temp_dir, ''),
    join(temp_dir, ''),
    id,
    debloat
  );

  // Update database entry
  const package_updated = await db_entry.update({
    PackageID: id,
    PackageName: name,
    PackageZipB64: b64_ingestible,
    GitHubLink: git_url,
    ReadmeContent: readme_str,
    UploadTypeURL: 1,
    VersionNumber: version,
    updatedAt: Date.now(),
    FK_UserID: res.locals.UserID, // from authenticate, response locals object field set
  });
  const size_cost = await npm_compute_optional_update_package_name(
    [name],
    true,
    false,
    false
  );
  if (size_cost === -1) {
    globalThis.logger?.info('On UPDATE, size cost update failed');
  }
  delete_dir(temp_dir);

  if (package_updated) {
    globalThis.logger?.info('Package update success!');
    res.contentType('application/json').status(200).send();
    return;
  }
  globalThis.logger?.info('Failure to update db on update, 400!');
  res.contentType('application/json').status(400).send();
}

export async function package_id_put(req: Request, res: Response) {
  try {
    const debloat_in = req.get('debloat');
    let debloat_arg: Debloat = 0;
    if (debloat_in !== undefined) {
      debloat_arg = Number(debloat_in);
    }
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
      globalThis.logger?.info(
        `Version number does not match metadata input: ${result.VersionNumber} and ${mdata.Version}!`
      );
      res.contentType('application/json').status(400).send();
      return;
    }
    if (result.PackageID !== mdata.ID) {
      globalThis.logger?.info('PackageID does not match metadata input: 400!');
      res.contentType('application/json').status(400).send();
      return;
    }
    const content: string | undefined = pdata.Content;
    const url_in: string | undefined = pdata.URL;
    globalThis.logger?.debug(content);
    globalThis.logger?.debug(url_in);
    // we are not implementing the JSProgram
    if (content !== undefined && url_in !== undefined) {
      globalThis.logger?.info('PackageData input has BOTH url and content!');
      res.contentType('application/json').status(400).send();
      return;
    } else if (content !== undefined) {
      package_id_put_content(
        req,
        res,
        mdata,
        pdata,
        result,
        content,
        debloat_arg
      );
      return;
    } else if (url_in !== undefined) {
      package_id_put_url(req, res, mdata, pdata, result, url_in, debloat_arg);
      return;
    } else {
      globalThis.logger?.info('PackageData input does not have Content or URL');
      res.contentType('application/json').status(400).send();
      return;
    }
    //console.log(query_data);
  } catch (err: any) {
    globalThis.logger?.error(`Error in package_id_put: ${err}`);
    res.status(400).send();
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
      if (result.UploadTypeURL === 0) {
        const temp_dir = await create_tmp();

        // 1. un-base64 it
        // 2. unzip it into PackagePath (neet to set)
        const zip_check = await unzip_base64_to_dir(
          result.PackageZipB64,
          temp_dir
        );
        if (zip_check !== undefined) {
          const size_cost = await npm_compute_optional_update_directory(
            join(zip_check, ''),
            false,
            true,
            false //doesnt matter
          );
          if (size_cost === -1) {
            globalThis.logger?.error(
              'Error deleting dependencies in package ID delete Content'
            );
          }
        }
        delete_dir(temp_dir);
      } else {
        // url public type
        const size_cost = await npm_compute_optional_update_package_name(
          [result.PackageName],
          false,
          true,
          false //doesnt matter
        );
        if (size_cost === -1) {
          globalThis.logger?.error(
            'Error deleting dependencies in package ID delete URL'
          );
        }
      }
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
    globalThis.logger?.error(`Error in package_id_delete: ${err}`);
    res.status(400).send();
    return;
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
  content: string,
  debloat: Debloat
) {
  // steps: content input is the b64 zip file
  // create temp directory to store package
  let temp_dir = await create_tmp();

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
  // find readme, nulll if not
  const readme_str = await find_and_read_readme(temp_dir);
  if (readme_str === null) {
    globalThis.logger?.info('Could not find README in package upload! Null');
  }
  delete_dir(temp_dir);

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
    res.contentType('application/json').status(400).send();
    return;
  }
  globalThis.logger?.info(
    `Package upload Content URL found: ${repository_url}`
  );
  const id: string = name.replace(/[\W]/g, '-').toLowerCase();
  // check if id exists already, error 409
  const result = await packages.findOne({
    where: {PackageID: id},
  });
  if (result) {
    globalThis.logger?.info('Not uploaded - package exists!');
    res.contentType('application/json').status(409).send();
    return;
  }

  // Create new temp_dir since score calc git clones
  temp_dir = await create_tmp();
  const ud: SCORE_OUT = await package_rate_compute(repository_url, temp_dir);
  if (debloat === 1) {
    content = await generate_base64_zip_of_dir(
      join(temp_dir, ''),
      join(temp_dir, ''),
      id,
      debloat
    );
  }

  // create database entry for Name Version ID URL RatedAndApproved and PackageData
  const package_uploaded = await packages.create({
    PackageID: id,
    PackageName: name,
    PackageZipB64: content,
    GitHubLink: ud.GitHubLink,
    ReadmeContent: readme_str,
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
    PullRequest: ud.Rating.PullRequest,
  });

  // update dependencies for size cost
  const size_cost = await npm_compute_optional_update_directory(
    join(temp_dir, ''),
    true,
    false,
    true
  );
  if (size_cost === -1) {
    globalThis.logger?.info('Error on size cost update in upload content');
  }
  delete_dir(temp_dir);

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
  url_in: string,
  debloat: Debloat
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
  // find readme, nulll if not
  const readme_str = await find_and_read_readme(temp_dir);
  if (readme_str === null) {
    globalThis.logger?.info('Could not find README in package upload! Null');
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
  const id: string = name.replace(/[\W]/g, '-').toLowerCase();
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
  // size cost calculation on package/update dependencies table with sizes
  const size_cost = await npm_compute_optional_update_package_name(
    [name],
    true,
    false,
    true
  );
  if (size_cost === -1) {
    globalThis.logger?.info('On upload, size cost update failed');
  }
  // 5. If ingestible: look at local clone created by rating call
  // 6. zip it, then base64 it, then return that b64 in content
  const b64_ingestible = await generate_base64_zip_of_dir(
    join(temp_dir, ''),
    join(temp_dir, ''),
    id,
    debloat
  );
  // create database entry for Name Version ID URL RatedAndApproved
  const package_uploaded = await packages.create({
    PackageID: id,
    PackageName: name,
    PackageZipB64: b64_ingestible,
    GitHubLink: ud.GitHubLink,
    ReadmeContent: readme_str,
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
    PullRequest: ud.Rating.PullRequest,
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
    const debloat_in = req.get('debloat');
    let debloat_arg: Debloat = 0;
    if (debloat_in !== undefined) {
      debloat_arg = Number(debloat_in);
    }
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
      package_post_content(req, res, input, content, debloat_arg);
    } else if (url_in !== undefined) {
      package_post_url(req, res, input, url_in, debloat_arg);
    } else {
      globalThis.logger?.info('PackageData input does not have Content or URL');
      res.contentType('application/json').status(400).send();
    }
  } catch (err: any) {
    globalThis.logger?.error(`Error in package_post: ${err}`);
    res.status(400).send();
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
        res.status(400).send();
      }
    } else {
      //package not found
      globalThis.logger?.info('Package ID not found!');
      res.contentType('application/json').status(404).send();
    }
  } catch (err: any) {
    delete_dir(temp_dir);
    globalThis.logger?.error(`Error in package_id_rate_get: ${err}`);
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
export async function package_byName_name_delete(req: Request, res: Response) {
  try {
    const result = await packages.findOne({
      where: {PackageName: req.params.name},
    });
    if (result) {
      if (result.UploadTypeURL === 0) {
        const temp_dir = await create_tmp();

        // 1. un-base64 it
        // 2. unzip it into PackagePath (neet to set)
        const zip_check = await unzip_base64_to_dir(
          result.PackageZipB64,
          temp_dir
        );
        if (zip_check !== undefined) {
          const size_cost = await npm_compute_optional_update_directory(
            join(zip_check, ''),
            false,
            true,
            false //doesnt matter
          );
          if (size_cost === -1) {
            globalThis.logger?.error(
              'Error deleting dependencies in package ID delete Content'
            );
          }
        }
        delete_dir(temp_dir);
      } else {
        // url public type
        const size_cost = await npm_compute_optional_update_package_name(
          [result.PackageName],
          false,
          true,
          false //doesnt matter
        );
        if (size_cost === -1) {
          globalThis.logger?.error(
            'Error deleting dependencies in package ID delete URL'
          );
        }
      }
      // don't need to do anything except clear database entry
      // directory of package always deleted on upload/rate!
      const del = await packages.destroy({
        where: {PackageName: req.params.name},
      });
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
    globalThis.logger?.error(`Error in package_byName_name_delete: ${err}`);
    res.status(400).send();
  }
}

/* ////////////////////////////////////////////////////////////////////////
 *
 * 							PACKAGE_BYREGEX_REGEX_POST
 *
 */ ///////////////////////////////////////////////////////////////////////
export function package_byRegEx_regex_post(req: Request, res: Response) {
  res.status(200).send('This is wrong response btw');
}
