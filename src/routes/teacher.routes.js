import express from "express";
import { getTimeTable, getProfile, assignCourseToTeacher, getCourseTeachers, removeTeacherFromCourse } from "../controllers/teacher.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.get('/profile', roleMiddleware(['teacher']), authMiddleware, getProfile);


router.get('/profile/:id', roleMiddleware(['admin']), authMiddleware, getProfile);

router.get(
  "/timetable",
  roleMiddleware(["teacher"]),
  authMiddleware,
  getTimeTable
);

// these are admin routes for teacher management
// Add these routes
router.put(
  "/assign-course-to-teacher/:teacherId",
  roleMiddleware(["admin"]),
  authMiddleware,
  assignCourseToTeacher
);

router.get(
  "/course-teachers/:courseId",
  roleMiddleware(["admin"]),
  authMiddleware,
  getCourseTeachers
);

router.put(
  "/remove-teacher-from-course/:teacherId",
  roleMiddleware(["admin"]),
  authMiddleware,
  removeTeacherFromCourse
);

export default router;