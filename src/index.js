import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRouter from "./routes/auth.routes.js";
import mongoConnectDB from "./config/db.js";
dotenv.config();

const PORT = process.env.PORT || 4000;

const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors())
// app.use(cors({
//   origin: "*",
//   credentials: false
// }));
// app.use(cors({
//   origin: process.env.CLIENT_URL || "http://localhost:3000",
//   credentials: true
// }));

mongoConnectDB();

app.get("/", (req, res) => {
  res.send("yes the backend is working fine");
});

app.use("/api/auth", authRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on the locally: http://0.0.0.0:${PORT}`);
});
