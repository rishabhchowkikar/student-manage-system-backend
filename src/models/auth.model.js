// import mongoose from "mongoose";
// import { createRequire } from "module";

// // Use CommonJS module inside ESM
// const require = createRequire(import.meta.url);
// const AutoIncrement = require("mongoose-sequence")(mongoose);

// const StudentPersonalDetailSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true },

//     rollno: {
//       type: Number, // Must be Number for auto-increment
//       unique: true,
//     },

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       match: [
//         /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
//         "Please enter a valid email",
//       ],
//     },
//     password: { type: String, required: true },
//     phone: { type: String, trim: true, minlength: 10 },
//     altPhone: { type: String, trim: true, minlength: 10 },
//     address: { type: String, trim: true },
//     dob: { type: Date },
//     gender: { type: String, enum: ["Male", "Female", "Other"] },
//     isPwd: { type: Boolean, default: false },
//     category: { type: String, trim: true },
//     nationality: { type: String, trim: true },
//     bloodGroup: { type: String, trim: true },
//     photo: { type: String, trim: true },
//     fatherName: { type: String, trim: true },
//     motherName: { type: String, trim: true },
//     role: { type: String, enum: ["student", "admin"], default: "student" },
//     courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Auto-increment roll number from 200000
// StudentPersonalDetailSchema.plugin(AutoIncrement, {
//   inc_field: "rollno",
//   start_seq: 200000,
// });

// const StudentPersonalDetail = mongoose.model(
//   "StudentPersonalDetail",
//   StudentPersonalDetailSchema
// );

// export default StudentPersonalDetail;

import mongoose from "mongoose";
import { createRequire } from "module";

// Use CommonJS module inside ESM
const require = createRequire(import.meta.url);
const AutoIncrement = require("mongoose-sequence")(mongoose);

const StudentPersonalDetailSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rollno: {
      type: Number,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: { type: String, required: true },
    phone: { type: String, trim: true, minlength: 10 },
    altPhone: { type: String, trim: true, minlength: 10 },
    address: { type: String, trim: true },
    dob: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    isPwd: { type: Boolean, default: false },
    category: { type: String, trim: true },
    nationality: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    aadharNumber: { type: String, trim: true },
    photo: { type: String, trim: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  },
  {
    timestamps: true,
  }
);

// Auto-increment roll number from 200000
StudentPersonalDetailSchema.plugin(AutoIncrement, {
  inc_field: "rollno",
  start_seq: 1,
});

const StudentPersonalDetail = mongoose.model(
  "StudentPersonalDetail",
  StudentPersonalDetailSchema
);

export default StudentPersonalDetail;
