import express from "express";
import {
  createSubject,
  getSubjects,
  getTeachers,
  createTimeTable,
  getTimeTable,
  getAllStudents,
  deleteTimeTable,
  getAllTimeTables,
  getTimeTableById,
  updateTimeTable,
  getTimeTablesByCourseId,
  updateSubjectTeacher,
  getSubjectsByCourseId
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
  "/courses/:courseId/subjects",
  roleMiddleware(["admin", "teacher"]),
  authMiddleware,
  getSubjectsByCourseId
);

router.put("/subject/:id", roleMiddleware(["admin"]), authMiddleware, updateSubjectTeacher);

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

// NEW - Update existing timetable (PUT request)
router.put(
  "/timetable/:id",
  roleMiddleware(["admin"]),
  authMiddleware,
  updateTimeTable
);

// NEW - Get all timetables (for admin dashboard)
router.get(
  "/timetables",
  roleMiddleware(["admin"]),
  authMiddleware,
  getAllTimeTables
);

// NEW - Get specific timetable by ID (for editing)
router.get(
  "/timetable/:id",
  roleMiddleware(["admin"]),
  authMiddleware,
  getTimeTableById
);

// NEW - Delete timetable
router.delete(
  "/timetable/:id",
  roleMiddleware(["admin"]),
  authMiddleware,
  deleteTimeTable
);

// Route to get timetables by specific courseId
router.get('/timetable/course/:courseId', getTimeTablesByCourseId);


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

// something is added again