// import express, { Router } from "express";

// import {
//   updateHostelDetails,
//   getHostelDetails,
// } from "../controllers/hostel.controller.js";

// import authMiddleware from "../middlewares/auth.middleware.js";
// import roleMiddleware from "../middlewares/role.middleware.js";

// const router = express.Router();

// router.put("/", authMiddleware, roleMiddleware(["admin"]), updateHostelDetails);

// router.get("/", authMiddleware, roleMiddleware(["student"]), getHostelDetails);

// export default router;


import express from "express";
import {
  updateHostelDetails,
  getHostelDetails,
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

export default router;