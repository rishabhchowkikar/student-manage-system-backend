import express from "express";
import {
  getFeeStructure,
  getStudentFeeStatus,
  createCourseFeesOrder,
  verifyCourseFeesPayment,
  getPendingFees,
  getFeePaymentHistory,
  getAllFeeRecords,
  createFeeStructure,
  getAllFeeStructures,
  updateFeeStructure,
  generateYearwiseFeeRecords
} from "../controllers/courseFee.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

// Student routes
router.get(
  "/structure",
  roleMiddleware(["student", "admin"]),
  authMiddleware,
  getFeeStructure
);

router.get(
  "/yearwise-structure",
  roleMiddleware(["student"]),
  authMiddleware,
  generateYearwiseFeeRecords
);

router.get(
  "/status",
  roleMiddleware(["student", "admin"]),
  authMiddleware,
  getStudentFeeStatus
);

router.get(
  "/pending",
  roleMiddleware(["student"]),
  authMiddleware,
  getPendingFees
);

router.get(
  "/history",
  roleMiddleware(["student"]),
  authMiddleware,
  getFeePaymentHistory
);

router.post(
  "/create-order",
  roleMiddleware(["student"]),
  authMiddleware,
  createCourseFeesOrder
);

router.post(
  "/verify-payment",
  roleMiddleware(["student"]),
  authMiddleware,
  verifyCourseFeesPayment
);

// Admin routes
router.get(
  "/all",
  roleMiddleware(["admin"]),
  authMiddleware,
  getAllFeeRecords
);

router.post(
  "/admin/create-structure",
  roleMiddleware(["admin"]),
  authMiddleware,
  createFeeStructure
);

router.put(
  "/admin/update-structure/:structureId",
  roleMiddleware(["admin"]),
  authMiddleware,
  updateFeeStructure
);

router.get(
  "/admin/structures",
  roleMiddleware(["admin"]),
  authMiddleware,
  getAllFeeStructures
);

export default router;