import express from "express";
import {
  uploadClassAttendance,
  getClassList,
  getStudentAttendance,
  getStudentMarks,
  uploadClassMarks,
  updateClassMarks,
} from "../controllers/marks.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/marks",
  roleMiddleware(["teacher"]),
  authMiddleware,
  uploadClassMarks
);

router.put(
  "/marks",
  roleMiddleware(["teacher"]),
  authMiddleware,
  updateClassMarks
);

router.post(
  "/attendance",
  roleMiddleware(["teacher"]),
  authMiddleware,
  uploadClassAttendance
);

router.get(
  "/marks",
  roleMiddleware(["student"]),
  authMiddleware,
  getStudentMarks
);

router.get(
  "/attendance",
  roleMiddleware(["student"]),
  authMiddleware,
  getStudentAttendance
);

router.get(
  "/class",
  roleMiddleware(["teacher"]),
  authMiddleware,
  getClassList
);

export default router;