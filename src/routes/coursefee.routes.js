// routes/courseFee.routes.js
import express from "express";
import {
  // Student Controllers
  getStudentFeeStructure,
  createFeePaymentOrder,
  verifyFeePayment,
  getPaymentHistory,
  getDueFees,
  getPendingFees,
  
  // Admin Controllers
  createFeeStructure,
  updateFeeStructure,
  getAllFeeStructures,
  getAllFeeRecords
} from "../controllers/courseFee.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

// ===============================
// STUDENT ROUTES
// ===============================

// Get complete fee structure for student (main endpoint)
router.get(
  "/student/fee-structure",
  roleMiddleware(["student"]),
  authMiddleware,
  getStudentFeeStructure
);

// Create payment order for current academic year
router.post(
  "/student/create-payment-order",
  roleMiddleware(["student"]),
  authMiddleware,
  createFeePaymentOrder
);

// Verify payment after successful transaction
router.post(
  "/student/verify-payment",
  roleMiddleware(["student"]),
  authMiddleware,
  verifyFeePayment
);

// Get complete payment history (paid, due, pending)
router.get(
  "/student/payment-history",
  roleMiddleware(["student"]),
  authMiddleware,
  getPaymentHistory
);

// Get only due fees with penalties
router.get(
  "/student/due-fees",
  roleMiddleware(["student"]),
  authMiddleware,
  getDueFees
);

// Get only pending fees (payment initiated but not completed)
router.get(
  "/student/pending-fees",
  roleMiddleware(["student"]),
  authMiddleware,
  getPendingFees
);

// ===============================
// ADMIN ROUTES
// ===============================

// Create new fee structure
router.post(
  "/admin/fee-structure",
  roleMiddleware(["admin"]),
  authMiddleware,
  createFeeStructure
);

// Update existing fee structure
router.put(
  "/admin/fee-structure/:structureId",
  roleMiddleware(["admin"]),
  authMiddleware,
  updateFeeStructure
);

// Get all fee structures with pagination and filters
router.get(
  "/admin/fee-structures",
  roleMiddleware(["admin"]),
  authMiddleware,
  getAllFeeStructures
);

// Get all fee records with pagination and filters
router.get(
  "/admin/fee-records",
  roleMiddleware(["admin"]),
  authMiddleware,
  getAllFeeRecords
);

// ===============================
// BACKWARD COMPATIBILITY ROUTES
// ===============================

// Legacy routes for existing frontend (if needed)
router.get(
  "/yearwise-structure",
  roleMiddleware(["student"]),
  authMiddleware,
  getStudentFeeStructure
);

router.get(
  "/history",
  roleMiddleware(["student"]),
  authMiddleware,
  getPaymentHistory
);

router.get(
  "/pending",
  roleMiddleware(["student"]),
  authMiddleware,
  getPendingFees
);

router.post(
  "/create-order",
  roleMiddleware(["student"]),
  authMiddleware,
  createFeePaymentOrder
);

router.post(
  "/verify-payment",
  roleMiddleware(["student"]),
  authMiddleware,
  verifyFeePayment
);

router.get(
  "/admin/structures",
  roleMiddleware(["admin"]),
  authMiddleware,
  getAllFeeStructures
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
  "/all",
  roleMiddleware(["admin"]),
  authMiddleware,
  getAllFeeRecords
);

export default router;
