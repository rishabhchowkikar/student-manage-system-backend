// Updated FeeStructure.model.js
import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  // Remove academicYear as a required field since fees are enrollment-based
  academicYear: {
    type: String,
    required: false, // Make optional for administrative reference only
  },
  // Add version/effective date for fee structure changes
  effectiveFrom: {
    type: Date,
    required: true,
    default: Date.now,
  },
  effectiveTo: {
    type: Date,
    required: false, // null means currently active
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
  // Add penalty configuration
  penaltyConfig: {
    penaltyRate: {
      type: Number,
      default: 0.02, // 2% per month
    },
    maxPenaltyPercent: {
      type: Number,
      default: 0.25, // 25% of original amount
    },
    gracePeriodDays: {
      type: Number,
      default: 30, // 30 days grace period
    },
  },
  // Add due date configuration
  dueDateConfig: {
    dueMonth: {
      type: Number,
      default: 7, // July
    },
    dueDay: {
      type: Number,
      default: 31, // 31st
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Add version control
  version: {
    type: Number,
    default: 1,
  },
  // Add description for administrative purposes
  description: {
    type: String,
    default: "",
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

// Update indexes for better performance
feeStructureSchema.index({ courseId: 1, isActive: 1 });
feeStructureSchema.index({ courseId: 1, effectiveFrom: -1 });
feeStructureSchema.index({ effectiveFrom: 1, effectiveTo: 1 });

// Add pre-save middleware to handle versioning
feeStructureSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add method to get current active fee structure for a course
feeStructureSchema.statics.getCurrentFeeStructure = async function(courseId) {
  const now = new Date();
  return await this.findOne({
    courseId,
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: now } }
    ]
  }).sort({ effectiveFrom: -1 });
};

// Add method to calculate penalty
feeStructureSchema.methods.calculatePenalty = function(dueDate, amount) {
  const currentDate = new Date();
  const due = new Date(dueDate);
  
  if (currentDate <= due) {
    return 0; // No penalty if not overdue
  }
  
  const daysOverdue = Math.ceil((currentDate - due) / (1000 * 60 * 60 * 24));
  const gracePeriod = this.penaltyConfig?.gracePeriodDays || 30;
  
  if (daysOverdue <= gracePeriod) {
    return 0; // No penalty during grace period
  }
  
  const monthsOverdue = Math.ceil((daysOverdue - gracePeriod) / 30);
  const penaltyRate = this.penaltyConfig?.penaltyRate || 0.02; // 2% per month
  const maxPenaltyPercent = this.penaltyConfig?.maxPenaltyPercent || 0.25; // 25% max
  
  const penalty = Math.min(
    amount * penaltyRate * monthsOverdue,
    amount * maxPenaltyPercent
  );
  
  return Math.round(penalty);
};

// Add method to get due date for a specific academic year
feeStructureSchema.methods.getDueDate = function(academicYear) {
  const yearStart = parseInt(academicYear.split('-')[0]);
  const dueMonth = this.dueDateConfig.dueMonth || 7;
  const dueDay = this.dueDateConfig.dueDay || 31;
  
  return new Date(yearStart, dueMonth - 1, dueDay);
};

const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);
export default FeeStructure;
