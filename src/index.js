import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import academicRoutes from "./routes/academic.routes.js";
import marksRoutes from "./routes/marks.routes.js";
import examRoutes from "./routes/exam.routes.js";
import hostelRoutes from "./routes/hostel.routes.js";
import courseRoutes from "./routes/course.routes.js"
import mongoConnectDB from "./config/db.js";
import { testCloudinaryConnection } from "./utils/cloudinary.js";

const app = express();


mongoConnectDB();

// Test Cloudinary connection on startup
testCloudinaryConnection();

// middlewares
app.use(express.json({limit: "10mb"  }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  if (req.method !== 'GET') {
    console.log('Request body keys:', Object.keys(req.body || {}));
    if (req.file) {
      console.log('File upload detected:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }
  }
  next();
});

// app.use(cors());
// app.use(cors({
//   origin: "*",
//   credentials: false
// }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("yes the backend is working fine");
});

// Test endpoint for Cloudinary
app.get("/api/test/cloudinary", async (req, res) => {
  try {
    const isConnected = await testCloudinaryConnection();
    res.json({
      message: "Cloudinary test completed",
      status: isConnected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: "Cloudinary test failed",
      error: error.message,
      status: false
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/academics", academicRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/hostel", hostelRoutes);
app.use("/api/course", courseRoutes)


const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on the locally: http://0.0.0.0:${PORT}`);
});
