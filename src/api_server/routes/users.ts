import express = require('express');
export const router = express.Router();


import {
  signup,
  updateUser,
  deleteUser,
  getUserAuthInfo,
} from "../controllers/user_controller";


router.post("/", signup);
router.post("/", updateUser);
router.post("/", deleteUser);
router.post("/", getUserAuthInfo);
