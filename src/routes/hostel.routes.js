import express from "express";
import {
  updateHostelDetails,
  getHostelDetails,
  applyForBusPass,
  getBusPassApplications,
  getStudentBusPass,
  getAvailableAcademicYears,
  getHostelPaymentByYear,
  getHostelPaymentHistory,
  updatePaymentStatus
} from "../controllers/hostel.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.put(
  "/",
  roleMiddleware(["admin"]),
  authMiddleware,
  updateHostelDetails
);

router.get(
  "/",
  roleMiddleware(["student","admin"]),
  authMiddleware,
  getHostelDetails
);

// New routes for payment history
router.get(
  "/payment-history",
  roleMiddleware(["student"]),
  authMiddleware,
  getHostelPaymentHistory
);

router.get(
  "/payment/:academicYear",
  roleMiddleware(["student"]),
  authMiddleware,
  getHostelPaymentByYear
);

router.get(
  "/academic-years",
  roleMiddleware(["student"]),
  authMiddleware,
  getAvailableAcademicYears
);

router.put(
  "/payment-status/:hostelId",
  roleMiddleware(["admin"]),
  authMiddleware,
  updatePaymentStatus
);

// bus pass routes

router.post(
  "/apply-bus-pass",
  roleMiddleware(["student"]),
  authMiddleware,
  applyForBusPass
);

router.get(
  "/bus-pass-applications",
  roleMiddleware(["admin"]),
  authMiddleware,
  getBusPassApplications
);


router.get("/my-bus-pass",
  roleMiddleware(["student"]),
  authMiddleware,
  getStudentBusPass
)

export default router;