// You should use models for return
import {Request, Response} from 'express';
const semver = require('semver');
import {PackageMetadata, PackageQuery} from '../models/models';
import {sequelize, packages} from '../db_connector';
import {match} from 'assert';
import {Op} from 'sequelize';

interface Payload {
  Name: string;
  Version: string;
  ID: string | null;
}
export async function packages_list(req: Request, res: Response) {
  const pa: Payload[] = req.body;

  try {
    globalThis.logger?.debug(`request parameters: ${req.params.offset}`);
    const offsetPag = parseInt(req.params.offset as string) || 0;
    globalThis.logger?.debug(`offet for pagination: ${offsetPag}`);
    const limitRes = 25;
    const packageList: PackageMetadata[] = [];

    const store: any[] = [];

    if (pa.length === 0) {
      globalThis.logger?.error(
        'There is missing field(s) in the PackageQuery/AuthenticationToken or it is formed improperly, or the AuthenticationToken is invalid.'
      );
      res.status(400).send();
    }

    if (pa.length === 1 && pa[0].Name === '*') {
      const allPackages = await packages.findAll({
        attributes: ['PackageName', 'VersionNumber', 'PackageID'],
        order: [['PackageName', 'ASC']],
        offset: offsetPag,
        limit: limitRes,
      });

      for (let i = 0; i < allPackages.length; i++) {
        const content: PackageMetadata = {
          Name: allPackages[i].PackageName,
          Version: allPackages[i].VersionNumber,
          ID: allPackages[i].PackageID.toString(),
        };
        globalThis.logger?.debug(`regex result: ${content}`);
        packageList.push(content);
      }
      res.contentType('application/json').status(200).send(packageList);
      return;
    } else {
      let offsetCount = 0;

      //Iterate over packages
      for (const p of pa) {
        const {Name, Version} = p;
        const matchingPackage = await packages.findOne({
          where: {
            PackageName: Name,
          },
          attributes: ['PackageName', 'VersionNumber', 'PackageID'],
        });

        //Semver matches the request body
        if (semver.satisfies(matchingPackage?.VersionNumber, Version)) {
          store.push(matchingPackage);
        }
        offsetCount++;
        if (offsetCount >= offsetPag + limitRes) {
          break;
        }
      }

      const tempList: PackageMetadata[] = [];
      if (store.length !== 0) {
        for (let i = 0; i < store.length; i++) {
          const content: PackageMetadata = {
            Name: store[i].PackageName,
            Version: store[i].VersionNumber,
            ID: store[i].PackageID.toString(),
          };
          globalThis.logger?.debug(`regex result: ${content}`);
          tempList.push(content);
        }
      }
        packageList.push(...tempList.slice(offsetPag, offsetPag + limitRes));
        res.contentType('application/json').status(200).send(packageList);
      }
  } catch (err: any) {
    globalThis.logger?.error('There is an error here');
    res.status(400).send();
  }
}