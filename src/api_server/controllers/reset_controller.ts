// You should use models for return
import {ModelError} from '../../api_server/models/models';
import {Request, Response} from 'express';
import {packages, users, usergroups} from '../db_connector';
import {Op} from 'sequelize';

export async function reset(req: Request, res: Response) {
  try {
    // check auth, should be done always
    // check user permission to reset registry (isAdmin)
    const user = await users.findOne({where: {UserID: res.locals.UserID}});
    if (user === null) {
      globalThis.logger?.info('Not reset - could not find user ID in DB!');
      res.contentType('application/json').status(400).send();
      return;
    }
    const permissions = JSON.parse(user.Permissions);
    const isAdmin = permissions.isAdmin;
    globalThis.logger?.debug(`isAdmin: ${isAdmin}`);
    if (isAdmin !== true) {
      // come back to this json parsing
      globalThis.logger?.info('Not reset - no admin permissions!');
      res.contentType('application/json').status(401).send();
      return;
    }
    // now actually reset the registry
    // Delete everything from packages table
    await packages.destroy({
      truncate: true,
    });

    // delete everything from usergroups
    await usergroups.destroy({
      truncate: true,
    });

    // delete everything except default user from users
    await users.destroy({
      where: {
        Username: {
          [Op.not]: 'ece30861defaultadminuser',
        },
      },
    });
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
