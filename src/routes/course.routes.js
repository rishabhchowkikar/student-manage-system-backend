import express from "express";
import { addCourse, getCourseDetails, updateAssignedTeachers,getCoursesForSignup } from "../controllers/course.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/",roleMiddleware(["admin"]),authMiddleware, addCourse);

router.get(
  "/",
  roleMiddleware(["admin", "student", "teacher"]),
  authMiddleware,
  getCourseDetails
);

router.put(
  "/assign-teachers",
  roleMiddleware(["admin"]),
  authMiddleware,
  updateAssignedTeachers
);

router.get("/signup-courses", getCoursesForSignup);
export default router;