// You should use models for return
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
      res.status(400).send();
      return;
    }
    const isAdmin = user.Permissions.isAdmin;
    globalThis.logger?.debug(`isAdmin: ${isAdmin}`);
    if (isAdmin !== true) {
      // come back to this json parsing
      globalThis.logger?.info('Not reset - no admin permissions!');
      res.status(401).send();
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
    res.status(200).send();
  } catch (err: any) {
    globalThis.logger?.error(`Error in reset: ${err}`);
    if (err instanceof Error) {
      res.status(400).send();
    } else {
      res.status(400).send();
    }
  }
}
