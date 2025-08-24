// src/routes/dashboard.routes.js

import express from "express";
import { getAdminDashboardStats } from "../controllers/dashboard.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
    "/admin/stats",
    roleMiddleware(["admin"]),
    authMiddleware,
    getAdminDashboardStats
);

export default router;