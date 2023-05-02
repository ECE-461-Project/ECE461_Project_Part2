// src/controllers/index.ts
import {Request, Response} from 'express';
import {users} from '../db_connector';

export async function signup(req: Request, res: Response) {
  try {
    const data = req.body;
    const adminUsername = data.adminUsername;
    const adminPassword = data.adminPassword;
    const newUser = data.newUser;

    if (adminUsername === undefined) {
      res.status(400).json({message: 'Username is undefined'});
      return;
    }

    if (adminPassword === undefined) {
      res.status(400).json({message: 'Password is undefined'});
      return;
    }

    if (newUser === undefined) {
      res.status(400).json({message: 'User is undefined'});
      return;
    }

    if (newUser.Username === undefined) {
      res.status(400).json({message: 'Username is undefined'});
      return;
    }

    if (newUser.UserPassword === undefined) {
      res.status(400).json({message: 'Password is undefined'});
      return;
    }

    if (newUser.Permissions === undefined) {
      res.status(400).json({message: 'Permissions is undefined'});
      return;
    }

    if (newUser.Permissions.isAdmin === undefined) {
      res.status(400).json({message: 'Permissions.isAdmin is undefined'});
      return;
    }

    if (newUser.Permissions.upload === undefined) {
      res.status(400).json({message: 'Permissions.upload is undefined'});
      return;
    }

    if (newUser.Permissions.search === undefined) {
      res.status(400).json({message: 'Permissions.search is undefined'});
      return;
    }

    if (newUser.Permissions.download === undefined) {
      res.status(400).json({message: 'Permissions.download is undefined'});
      return;
    }

    if (!(await isAdmin(adminUsername, adminPassword))) {
      res.status(400).json({message: 'Unauthorized'});
      return;
    }

    const user = await users.create(newUser);

    res.status(200).json({
      message: 'User created successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        message: 'Error creating user',
      });
    } else {
      res.status(400).json({
        message: 'Error creating user',
      });
    }
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    //const { adminUsername, adminPassword, userId, updatedUserData } = req.body;

    const data = req.body;
    const adminUsername = data.adminUsername;
    const adminPassword = data.adminPassword;
    const userId = data.userId;
    const updatedUserData = data.updatedUserData;

    if (adminUsername === undefined) {
      res.status(400).json({message: 'Undefined Username'});
      return;
    }

    if (adminPassword === undefined) {
      res.status(400).json({message: 'Undefined Password'});
      return;
    }

    if (userId === undefined) {
      res.status(400).json({message: 'Undefined UserId'});
      return;
    }

    if (updatedUserData === undefined) {
      res.status(400).json({message: 'Undefined UpdateUserData'});
      return;
    }

    if (updatedUserData.Password === undefined) {
      res.status(400).json({message: 'Undefined Password for New Data'});
      return;
    }

    if (!(await isAdmin(adminUsername, adminPassword))) {
      res.status(400).json({message: 'Unauthorized'});
      return;
    }

    const user = await users.findByPk(userId);

    if (!user) {
      res.status(400).json({
        message: 'User not found',
      });
      return;
    }

    await user.update(updatedUserData);

    res.status(200).json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        message: 'Error creating user',
        error: error.message,
      });
    } else {
      res.status(400).json({
        message: 'Error updating user',
        error: 'Unknown error',
      });
    }
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    //const { username, password } = req.body;

    const data = req.body;
    const username = data.username;
    const password = data.password;

    if (data === undefined) {
      res.status(400).json({message: 'Data is not defined'});
    }

    if (username === undefined) {
      res.status(400).json({message: 'Username is not defined'});
    }

    if (password === undefined) {
      res.status(400).json({message: 'Password is not defined'});
    }

    if (!(await isCorrectUser(username, password))) {
      res.status(400).json({message: 'Unauthorized'});
      return;
    }

    const user = await users.findOne({where: {Username: username}});
    if (!user) {
      res.status(400).json({
        message: 'User not found',
      });
      return;
    }

    await user.destroy();

    res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        message: 'Error deleting user',
      });
    } else {
      res.status(400).json({
        message: 'Error deleting user',
      });
    }
  }
}

export const isAdmin = async (
  username: string,
  password: string
): Promise<boolean> => {
  try {
    const user = await users.findOne({where: {Username: username}});

    if (
      user &&
      user.UserPassword === password &&
      user.Permissions.isAdmin === true
    ) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const isCorrectUser = async (
  username: string,
  password: string
): Promise<boolean> => {
  try {
    const user = await users.findOne({where: {Username: username}});

    if (user && user.UserPassword === password) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};
