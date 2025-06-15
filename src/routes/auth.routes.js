// import express from "express";
// import {
//   logout,
//   checkAuth,
//   changePassword,
// } from "../controllers/auth.controller.js";
// import {
//   loginStudentController,
//   signUpStudentController,
// } from "../controllers/studentAuth.controller.js";
// import {
//   loginTeacherController,
//   signUpTeacherController,
// } from "../controllers/teacherAuth.controller.js";
// import {
//   loginAdminController,
//   signUpAdminController,
// } from "../controllers/adminAuth.controller.js";
// import { updatePersonalDetailsController } from "../controllers/student.controller.js";
// import authMiddleware from "../middlewares/auth.middleware.js";
// import roleMiddleware from "../middlewares/role.middleware.js";

// const router = express.Router();

// router.use((req, res, next) => {
//   console.log(`Auth Route: ${req.method} ${req.originalUrl}`);
//   next();
// });

// router.post("/student/login", loginStudentController);
// router.post("/student/sign-up", signUpStudentController);
// router.post("/teacher/login", loginTeacherController);
// router.post("/teacher/sign-up", signUpTeacherController);
// router.post("/admin/login", loginAdminController);
// router.post("/admin/sign-up", signUpAdminController);
// router.post("/logout", authMiddleware, logout);
// router.get("/check-auth", authMiddleware, checkAuth);
// router.put(
//   "/update-personal-details",
//   authMiddleware,
//   roleMiddleware(["student"]),
//   updatePersonalDetailsController
// );
// router.put(
//   "/change-password",
//   authMiddleware,
//   roleMiddleware(["student", "teacher"]),
//   changePassword
// );

// export default router;


import express from "express";
import {
  logout,
  checkAuth,
  changePassword,
} from "../controllers/auth.controller.js";
import {
  loginStudentController,
  signUpStudentController,
} from "../controllers/studentAuth.controller.js";
import {
  loginTeacherController,
  signUpTeacherController,
} from "../controllers/teacherAuth.controller.js";
import {
  loginAdminController,
  signUpAdminController,
} from "../controllers/adminAuth.controller.js";
import { updatePersonalDetailsController } from "../controllers/student.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.use((req, res, next) => {
  console.log(`Auth Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Public routes (no auth required)
router.post("/student/login", loginStudentController);
router.post("/student/sign-up", signUpStudentController);
router.post("/teacher/login", loginTeacherController);
router.post("/teacher/sign-up", signUpTeacherController);
router.post("/admin/login", loginAdminController);
router.post("/admin/sign-up", signUpAdminController);

// Protected routes
router.post(
  "/logout",
  roleMiddleware(["admin", "student", "teacher"]), // Allow all roles
  authMiddleware,
  logout
);

router.get(
  "/check-auth",
  roleMiddleware(["admin", "student", "teacher"]), // Allow all roles
  authMiddleware,
  checkAuth
);

router.put(
  "/update-personal-details",
  roleMiddleware(["student"]),
  authMiddleware,
  updatePersonalDetailsController
);

router.put(
  "/change-password",
  roleMiddleware(["student", "teacher"]),
  authMiddleware,
  changePassword
);

export default router;