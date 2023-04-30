import express = require('express');
export const router = express.Router();


import {
  signup,
  updateUser,
  deleteUser,
} from "../controllers/user_controller";


router.post("/signup", signup);
router.post("/updateUser", updateUser);
router.post("/deleteUser", deleteUser);
