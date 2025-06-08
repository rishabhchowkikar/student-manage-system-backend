import express from "express";
import {
  createSubject,
  getSubjects,
  getTeachers,
  createTimeTable,
  getTimeTable,
} from "../controllers/academic.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/subjects",
  authMiddleware,
  roleMiddleware(["admin"]),
  createSubject
);
router.get(
  "/subjects",
  authMiddleware,
  roleMiddleware(["student"]),
  getSubjects
);

router.get("/teachers", authMiddleware, roleMiddleware(["admin"]), getTeachers);

router.post(
  "/timetable",
  authMiddleware,
  roleMiddleware(["admin"]),
  createTimeTable
);
router.get(
  "/timetable",
  authMiddleware,
  roleMiddleware(["student"]),
  getTimeTable
);

export default router;
