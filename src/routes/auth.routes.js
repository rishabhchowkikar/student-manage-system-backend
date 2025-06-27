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
import authMiddleware from "../middlewares/auth.middleware.js"
import roleMiddleware from "../middlewares/role.middleware.js";
import multer from "multer";


const router = express.Router();

router.use((req, res, next) => {
  console.log(`Auth Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Configuration multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB file size limit
  },
  fileFilter: (req, file, cb) => {
    console.log("File filter - mimetype:", file.mimetype);
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  }
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: "File too large. Maximum size is 20MB.",
        status: false
      });
    }
    return res.status(400).json({
      message: `File upload error: ${err.message}`,
      status: false
    });
  } else if (err) {
    return res.status(400).json({
      message: err.message,
      status: false
    });
  }
  next();
};

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
  upload.single('photo'), // Single image upload
  handleMulterError, // Handle multer errors
  updatePersonalDetailsController
);

router.put(
  "/change-password",
  roleMiddleware(["student", "teacher"]),
  authMiddleware,
  changePassword
);

export default router;