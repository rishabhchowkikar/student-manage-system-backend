import express from "express";
import {
  uploadClassAttendance,
  getClassList,
  getStudentAttendance,
  getStudentMarks,
} from "../controllers/marks.controller.js";

// router.post(
//   "/marks",
//   authMiddleware,
//   roleMiddleware(["teacher"]),
//   uploadClassMarks
// );
router.post(
  "/attendance",
  authMiddleware,
  roleMiddleware(["teacher"]),
  uploadClassAttendance
);
router.get(
  "/marks",
  authMiddleware,
  roleMiddleware(["student"]),
  getStudentMarks
);
router.get(
  "/attendance",
  authMiddleware,
  roleMiddleware(["student"]),
  getStudentAttendance
);
router.get("/class", authMiddleware, roleMiddleware(["teacher"]), getClassList);

export default router;
