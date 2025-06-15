// import express from "express";
// import {
//   getProfile,
//   updatePersonalDetailsController,
// } from "../controllers/student.controller.js";

// import authMiddleware from "../middlewares/auth.middleware.js";
// import roleMiddleware from "../middlewares/role.middleware.js";

// const router = express.Router();
// router.get("/profile", authMiddleware, roleMiddleware(["student"]), getProfile);
// router.put(
//   "/profile",
//   authMiddleware,
//   roleMiddleware(["student"]),
//   updatePersonalDetailsController
// );

// export default router;


import express from "express";
import {
  getProfile,
  updatePersonalDetailsController,
} from "../controllers/student.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/profile",
  roleMiddleware(["student","admin"]),
  authMiddleware,
  getProfile
);

router.put(
  "/profile",
  roleMiddleware(["student"]),
  authMiddleware,
  updatePersonalDetailsController
);

export default router;