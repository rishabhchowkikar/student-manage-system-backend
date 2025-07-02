import express from "express";
import {
  getProfile,
  updatePersonalDetailsController,
} from "../controllers/student.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import multer from "multer";

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
  upload.single('photo'), // Single image upload
  handleMulterError, // Handle multer errors
  updatePersonalDetailsController
);

export default router;