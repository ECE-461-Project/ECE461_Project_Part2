// You should use models for return
import {Request, Response} from 'express';
import {
  packages,
  users,
  usergroups,
  dependentPackageSize,
} from '../db_connector';
import {PackageSizeReturn} from '../models/models';

export async function get_size_cost(req: Request, res: Response) {
  const sample: PackageSizeReturn = {
    name: 'lodash',
    size: 5000,
  };
  const arr: PackageSizeReturn[] = [sample];
  res.contentType('application/json').status(200).send(arr);
}
