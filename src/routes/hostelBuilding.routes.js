// src/routes/hostelBuilding.routes.js
import express from "express";
import {
  createHostelApplication,
  getAllBuildings,
  getBuildingById,
  getRoomsByBuilding,
  getStudentsPendingAllocation,
  getAvailableRooms,
  allocateRoom,
  deallocateRoom,
  getHostelOverview,
  getFullRoomsCount
} from "../controllers/hostelBuilding.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

// Building management routes
router.get(
  "/buildings",
  roleMiddleware(["admin"]),
  authMiddleware,
  getAllBuildings
);

router.get(
  "/buildings/:buildingId",
  roleMiddleware(["admin"]),
  authMiddleware,
  getBuildingById
);

router.get(
  "/rooms/:buildingId",
  roleMiddleware(["admin"]),
  authMiddleware,
  getRoomsByBuilding
);

// Application creation route
router.post(
  "/create-application",
  roleMiddleware(["admin"]),
  authMiddleware,
  createHostelApplication
);

// Allocation management routes
router.get(
  "/pending-allocation",
  roleMiddleware(["admin"]),
  authMiddleware,
  getStudentsPendingAllocation
);

router.get(
  "/available-rooms",
  roleMiddleware(["admin"]),
  authMiddleware,
  getAvailableRooms
);

router.get(
  "/overview",
  roleMiddleware(["admin"]),
  authMiddleware,
  getHostelOverview
);

router.put(
  "/allocate-room",
  roleMiddleware(["admin"]),
  authMiddleware,
  allocateRoom
);

router.put(
  "/deallocate-room/:hostelId",
  roleMiddleware(["admin"]),
  authMiddleware,
  deallocateRoom
);

router.get("/building/:buildingId/full-rooms-count",
    roleMiddleware(["admin"]),
    authMiddleware,
    getFullRoomsCount
)

export default router;
