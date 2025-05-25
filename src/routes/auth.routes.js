import express from "express";
import {
  loginUserController,
  signUpUserController,
  logout,
  checkAuth,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", loginUserController);
router.post("/sign-up", signUpUserController);
router.post("/logout", logout);
router.get("/check-auth", authMiddleware, checkAuth); //

export default router;
