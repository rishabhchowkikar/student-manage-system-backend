import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import studentRoutes from "./routes/student.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import academicRoutes from "./routes/academic.routes.js";
import marksRoutes from "./routes/marks.routes.js";
import examRoutes from "./routes/exam.routes.js";
import hostelRoutes from "./routes/hostel.routes.js";
import courseRoutes from "./routes/course.routes.js"
import mongoConnectDB from "./config/db.js";

dotenv.config();
const app = express();

mongoConnectDB();

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
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
