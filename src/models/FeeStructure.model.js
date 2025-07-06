// models/FeeStructure.model.js
import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  feeBreakdown: {
    admissionFee: {
      type: Number,
      required: true,
      default: 0,
    },
    tuitionFee: {
      type: Number,
      required: true,
      default: 0,
    },
    labFee: {
      type: Number,
      default: 0,
    },
    libraryFee: {
      type: Number,
      default: 0,
    },
    examFee: {
      type: Number,
      default: 0,
    },
    developmentFee: {
      type: Number,
      default: 0,
    },
    otherFees: {
      type: Number,
      default: 0,
    },
  },
  totalYearlyFee: {
    type: Number,
    required: true,
  },
  paymentSchedule: {
    type: String,
    enum: ["yearly", "semester", "quarterly"],
    default: "yearly",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

feeStructureSchema.index({ courseId: 1, academicYear: 1 });

const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);
export default FeeStructure;
