// src/controllers/index.ts
import { Request, Response } from "express";
import { User } from "../models/user";

export const signup = async (req: Request, res: Response) => {
  try {
    const { adminUsername, adminPassword, newUser } = req.body;

    // You may want to implement an authentication check for adminUsername and adminPassword here
    if (!(await isAdmin(adminUsername, adminPassword))) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.create(newUser);

    res.status(200).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        message: "Error creating user",
        error: error.message,
      });
    } else {
      res.status(400).json({
        message: "Error creating user",
        error: "Unknown error",
      });
    }
  }
}

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { adminUsername, adminPassword, userId, updatedUserData } = req.body;

    // You may want to implement an authentication check for adminUsername and adminPassword here
    if (!(await isAdmin(adminUsername, adminPassword))) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(400).json({
        message: "User not found",
      });
      return;
    }

    await user.update(updatedUserData);

    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        message: "Error creating user",
        error: error.message,
      });
    } else {
      res.status(400).json({
        message: "Error updating user",
        error: "Unknown error",
      });
    }
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // You may want to implement an authentication check for username and password here
    if (!(await isAdmin(username, password))) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      res.status(400).json({
        message: "User not found",
      });
      return;
    }

    await user.destroy();

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        message: "Error deleting user",
        error: error.message,
      });
    } else {
      res.status(400).json({
        message: "Error deleting user",
        error: "Unknown error",
      });
    }
  }
}
  

export const getUserAuthInfo = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // You may want to implement an authentication check for username and password here
    if (!(await isAdmin(username, password))) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      res.status(400).json({
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      UserID: user.id,
      Username: user.username,
      UserPassword: user.password,
      Permissions: user.permissions,
      UserGroups: user.userGroups,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({
        message: "Error getting user authentication info",
        error: error.message,
      });
    } else {
      res.status(400).json({
        message: "Error getting user authentication info",
        error: "Unknown error",
      });
    }
  }
}

export const isAdmin = async (username: string, password: string): Promise<boolean> => {
  try {
    const user = await User.findOne({ where: { username } });
    if (user && user.password === password && user.permissions === "admin") {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};