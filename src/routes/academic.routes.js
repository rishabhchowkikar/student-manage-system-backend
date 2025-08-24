import express from "express";
import {
  createSubject,
  getSubjects,
  getTeachers,
  createTimeTable,
  getTimeTable,
  getAllStudents
} from "../controllers/academic.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/subjects",
  roleMiddleware(["admin"]), // Sets req.allowedRoles
  authMiddleware, // Checks token and role
  createSubject
);

router.get(
  "/subjects",
  roleMiddleware(["student"]),
  authMiddleware,
  getSubjects
);

router.get(
  "/teachers",
  roleMiddleware(["admin"]),
  authMiddleware,
  getTeachers
);

router.post(
  "/timetable",
  roleMiddleware(["admin"]),
  authMiddleware,
  createTimeTable
);

router.get(
  "/timetable",
  roleMiddleware(["student"]),
  authMiddleware,
  getTimeTable
);

router.get(
  "/getallstudents",
  roleMiddleware(["admin"]),
  authMiddleware,
  getAllStudents
)


export default router;