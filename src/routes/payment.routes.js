import express from "express";
import {
    createPaymentOrder,
    getPaymentStatus,
    verifyPayment,
    checkPendingPayment
} from "../controllers/payment.controller.js"

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/create-order",
    roleMiddleware(["student"]),
    authMiddleware,
    createPaymentOrder)

router.post("/verify",
    roleMiddleware(["student"]),
    authMiddleware,
    verifyPayment
)

router.get("/status",
    roleMiddleware(["student"]),
    authMiddleware,
    getPaymentStatus)

router.get("/check-pending",
    roleMiddleware(["student"]),
    authMiddleware,
    checkPendingPayment
)

export default router;