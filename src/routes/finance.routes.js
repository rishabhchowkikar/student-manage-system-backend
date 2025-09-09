import express from 'express';
import {
  // Hostel payment controllers
  getAllHostelPayments,
  getHostelPaymentDetails,
  updateHostelPaymentStatus,
  getHostelPaymentsByAcademicYear,
  
  // Bus pass payment controllers
  getAllBusPassPayments,
  updateBusPassPaymentStatus,
  getBusPassPaymentDetails,


  // student fees payment history controllers
  getAllStudentsCourseFees,
  getStudentCourseFees,
  
  // Finance summary and reports
  getDashboardSummary,
  getYearlyReport,
  getPaymentAnalytics,
  getPendingPayments,
  
  // Bulk payment operations
  exportPaymentReport,


} from '../controllers/finance.controller.js';

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

// ==== HOSTEL PAYMENT ROUTES ====

// Get all hostel payments with filters
router.get(
  '/hostel-payments',
  roleMiddleware(['admin', 'finance']),
  authMiddleware,
  getAllHostelPayments
);

// Get hostel payments by academic year
router.get(
  '/hostel-payments/year/:academicYear',
  roleMiddleware(['admin', 'finance']),
  authMiddleware,
  getHostelPaymentsByAcademicYear
);

// Get specific hostel payment details
router.get(
  '/hostel-payments/:paymentId',
  roleMiddleware(['admin', 'finance']),
  authMiddleware,
  getHostelPaymentDetails
);

// Update hostel payment status
router.put(
  '/hostel-payments/:paymentId/status',
  roleMiddleware(['admin', 'finance']),
  authMiddleware,
  updateHostelPaymentStatus
);

// ==== BUS PASS PAYMENT ROUTES ====

// Get all bus pass payments
router.get(
  '/buspass-payments',
  roleMiddleware(['admin', 'finance']),
  authMiddleware,
  getAllBusPassPayments
);

// Get specific bus pass payment details
router.get(
  '/buspass-payments/:paymentId',
  roleMiddleware(['admin', 'finance']),
  authMiddleware,
  getBusPassPaymentDetails
);

// Update bus pass payment status
router.put(
  '/buspass-payments/:paymentId/status',
  roleMiddleware(['admin', 'finance']),
  authMiddleware,
  updateBusPassPaymentStatus
);

// ==== STUDENT PAYMENT HISTORY ROUTES ====

router.get("/fees-records",
  roleMiddleware(["admin", "finance"]),
  authMiddleware,
  getAllStudentsCourseFees
)

router.get("/students/:studentId/fees",
  roleMiddleware(["admin","finance"]),
  authMiddleware,
  getStudentCourseFees
)

// ==== FINANCE DASHBOARD & REPORTS ROUTES ====

// Get overall payment summary for dashboard
router.get(
  '/dashboard/summary',
  roleMiddleware(['admin', 'finance']),
  authMiddleware,
  getDashboardSummary
);

// Get yearly payment report
router.get(
  '/reports/year/:year',
  roleMiddleware(['admin', 'finance']),
  authMiddleware,
  getYearlyReport
);

// Get payment analytics
router.get(
  '/analytics',
  roleMiddleware(['admin', 'finance']),
  authMiddleware,
  getPaymentAnalytics
);

// Get all pending payments
router.get(
  '/pending-payments',
  roleMiddleware(['admin', 'finance']),
  authMiddleware,
  getPendingPayments
);

// ==== BULK OPERATIONS ROUTES ====

router.get(
  '/export/payments',
  roleMiddleware(['admin', 'finance']),
  authMiddleware,
  exportPaymentReport
);

export default router;
