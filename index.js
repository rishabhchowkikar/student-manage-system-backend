import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
dotenv.config();
import { testCloudinaryConnection } from "./src/utils/cloudinary.js";
import authRoutes from "./src/routes/auth.routes.js";
import studentRoutes from "./src/routes/student.routes.js";
import teacherRoutes from "./src/routes/teacher.routes.js";
import academicRoutes from "./src/routes/academic.routes.js";
import marksRoutes from "./src/routes/marks.routes.js";
import examRoutes from "./src/routes/exam.routes.js";
import hostelRoutes from "./src/routes/hostel.routes.js";
import courseRoutes from "./src/routes/course.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import mongoConnectDB from "./src/config/db.js";
import courseFeesRoutes from "./src/routes/coursefee.routes.js";

const app = express();

mongoConnectDB();

// middlewares
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "http://localhost:3000",
      "https://student-management-system-frontend-self.vercel.app"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200,
    preflightContinue: false
  })
);

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  if (req.method !== "GET") {
    console.log("Request body keys:", Object.keys(req.body || {}));
    if (req.file) {
      console.log("File upload detected:", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    }
  }
  next();
});

app.use(
  cors({
    // origin: process.env.CLIENT_URL || "http://localhost:3000",
    origin: [
      process.env.CLIENT_URL,
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  const serverStatus = {
    message: "Server is running successfully! 🚀",
    status: "active",
    timestamp: new Date().toISOString(),
    server: {
      name: "Student Management System API",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      port: process.env.PORT || 4000,
    },
    endpoints: {
      auth: "/api/auth",
      student: "/api/student",
      teacher: "/api/teacher",
      academics: "/api/academics",
      marks: "/api/marks",
      exam: "/api/exam",
      hostel: "/api/hostel",
      course: "/api/course",
      payment: "/api/payment",
      courseFees: "/api/course-fees",
    },
    health: {
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
        total:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
      },
      platform: process.platform,
      nodeVersion: process.version,
    },
  };

  res.status(200).json(serverStatus);
});

// Test endpoint for Cloudinary
app.get("/api/test/cloudinary", async (req, res) => {
  try {
    const isConnected = await testCloudinaryConnection();
    res.json({
      message: "Cloudinary test completed",
      status: isConnected,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Cloudinary test failed",
      error: error.message,
      status: false,
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
app.use("/api/course", courseRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/course-fees", courseFeesRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on the locally: http://0.0.0.0:${PORT}`);
});
