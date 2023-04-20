// src/routes/index.ts
import { Router } from "express";
import {
  signup,
  updateUser,
  deleteUser,
  getUserAuthInfo,
} from "../controllers/user_controller";

const router = Router();

router.post("/signup", signup);
router.post("/updateUser", updateUser);
router.post("/deleteUser", deleteUser);
router.post("/getUserAuthInfo", getUserAuthInfo);

export default router;
