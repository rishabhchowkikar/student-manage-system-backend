
import express from "express";
import {
  submitExamForm,
  verifyExamForm,
  getExamFormDetails,
  getAllSubmittedExamForms,
  bulkVerifyExamForms,
  verifyExamFormByStudentId,
  enableHallTicketsForCourse,
  holdHallTicketForStudent,
  enableHallTicketForStudent,
} from "../controllers/exam.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

// Student submits the exam form
router.post(
  "/submit",
  roleMiddleware(["student"]), // Sets req.allowedRoles
  authMiddleware, // Checks token and role
  submitExamForm
);

// Admin verifies the exam form
router.put(
  "/verify/:examId",
  roleMiddleware(["admin"]),
  authMiddleware,
  verifyExamForm
);

// Student and Admin retrieve exam form details
router.get(
  "/details",
  roleMiddleware(["student", "admin"]),
  authMiddleware,
  getExamFormDetails
);

// new admin routes 
// 1. Get all submitted exam forms with complete details
router.get(
  "/admin/exam-forms",
  roleMiddleware(["admin"]),
  authMiddleware,
  getAllSubmittedExamForms
);

// 2. Bulk verify exam forms by course
router.put(
  "/admin/verify-bulk",
  roleMiddleware(["admin"]),
  authMiddleware,
  bulkVerifyExamForms
);

// 3. Verify exam form by studentId
router.put(
  "/admin/verify-student/:studentId",
  roleMiddleware(["admin"]),
  authMiddleware,
  verifyExamFormByStudentId
);

// 4. Enable hall tickets for all students in a course
router.put(
  "/admin/hall-tickets/enable",
  roleMiddleware(["admin"]),
  authMiddleware,
  enableHallTicketsForCourse
);

// 5. Hold hall ticket for specific student
router.put(
  "/admin/hall-tickets/hold/:studentId",
  roleMiddleware(["admin"]),
  authMiddleware,
  holdHallTicketForStudent
);

// Enable hall ticket for specific student
router.put(
  "/admin/hall-tickets/enable-student",
  roleMiddleware(["admin"]),
  authMiddleware,
  enableHallTicketForStudent
);
export default router;