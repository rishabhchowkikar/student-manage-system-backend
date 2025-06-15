// import express from "express";
// import {
//   submitExamForm,
//   verifyExamForm,
//   getExamFormDetails,
// } from "../controllers/exam.controller.js";
// import authMiddleware from "../middlewares/auth.middleware.js";
// import roleMiddleware from "../middlewares/role.middleware.js";

// const router = express.Router();

// // Student submits the exam form
// router.post(
//   "/submit",
//   authMiddleware,
//   roleMiddleware(["student"]),
//   submitExamForm
// );

// // Admin verifies the exam form
// router.put(
//   "/verify/:examId",
//   authMiddleware,
//   roleMiddleware(["admin"]),
//   verifyExamForm
// );

// // Student retrieves their exam form details
// router.get(
//   "/details",
//   authMiddleware,
//   roleMiddleware(["student","admin"]),
//   getExamFormDetails
// );

// export default router;

import express from "express";
import {
  submitExamForm,
  verifyExamForm,
  getExamFormDetails,
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

export default router;