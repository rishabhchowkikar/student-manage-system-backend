import express from "express";
import {
  updateExamDetails,
  getExamDetails,
  toggleExamFormAccess,
  registerForExam,
} from "../controllers/exam.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import router from "./auth.routes.js";

router.put("/", authMiddleware, roleMiddleware(["admin"]), updateExamDetails);
router.get("/", authMiddleware, roleMiddleware(["student"]), getExamDetails);
router.put(
  "/form-access",
  authMiddleware,
  roleMiddleware(["admin"]),
  toggleExamFormAccess
);

router.post(
  "/register",
  authMiddleware,
  roleMiddleware(["student"]),
  registerForExam
);

export default router;
