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
    want_to_apply_for_hostel: { type: Boolean, default: false }, // For first semester hostel application
    hostel_allocated: { type: Boolean, default: false }, // Track hostel allocation based on marks

    // requests for permission to update hostel details
    updatePermissionStatus: {
      type: String,
      enum: ["none", "requested", "approved", "rejected"],
      default: "none"
    },
    updatePermissionRequestDate: { type: Date },
    updatePermissionApprovedDate: { type: Date },
    updatePermissionRejectedDate: { type: Date },
    adminComments: { type: String },

    updatePermissionReason: { type: String }, // General reason
    requestedChanges: {
      type: Map,
      of: {
        currentValue: { type: mongoose.Schema.Types.Mixed },
        newValue: { type: mongoose.Schema.Types.Mixed },
        reason: { type: String }
      }
    }, // Specific field changes requested
    changesSummary: { type: String } // Human-readable summary of changes
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
