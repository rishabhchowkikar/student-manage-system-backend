// import express from "express";
// import {
//   createSubject,
//   getSubjects,
//   getTeachers,
//   createTimeTable,
//   getTimeTable,
// } from "../controllers/academic.controller.js";

// import authMiddleware from "../middlewares/auth.middleware.js";

// import roleMiddleware from "../middlewares/role.middleware.js";

// const router = express.Router();

// router.post(
//   "/subjects",
//   authMiddleware,
//   roleMiddleware(["admin"]),
//   createSubject
// );
// router.get(
//   "/subjects",
//   authMiddleware,
//   roleMiddleware(["student"]),
//   getSubjects
// );

// router.get("/teachers", authMiddleware, roleMiddleware(["admin"]), getTeachers);

// router.post(
//   "/timetable",
//   authMiddleware,
//   roleMiddleware(["admin"]),
//   createTimeTable
// );
// router.get(
//   "/timetable",
//   authMiddleware,
//   roleMiddleware(["student"]),
//   getTimeTable
// );

// export default router;


import express from "express";
import {
  createSubject,
  getSubjects,
  getTeachers,
  createTimeTable,
  getTimeTable,
} from "../controllers/academic.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/subjects",
  roleMiddleware(["admin"]), // Sets req.allowedRoles
  authMiddleware, // Checks token and role
  createSubject
);

router.get(
  "/subjects",
  roleMiddleware(["student"]),
  authMiddleware,
  getSubjects
);

router.get(
  "/teachers",
  roleMiddleware(["admin"]),
  authMiddleware,
  getTeachers
);

router.post(
  "/timetable",
  roleMiddleware(["admin"]),
  authMiddleware,
  createTimeTable
);

router.get(
  "/timetable",
  roleMiddleware(["student"]),
  authMiddleware,
  getTimeTable
);

export default router;