import express from "express";
import { getTimeTable, getProfile } from "../controllers/teacher.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, roleMiddleware(["teacher"]), getProfile);
router.get(
  "/timetable",
  authMiddleware,
  roleMiddleware(["teacher"]),
  getTimeTable
);

export default router;
