// models/CourseFees.model.js
import mongoose from "mongoose";

const courseFeesSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentPersonalDetail",
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  feeType: {
    type: String,
    enum: ["admission", "yearly", "semester", "exam", "library", "lab"],
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
    // Format: "2024-2025", "2025-2026"
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
    // Only required for semester fees
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  paidDate: {
    type: Date,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "overdue", "partial", "failed"],
    default: "pending",
  },
  razorpayOrderId: {
    type: String,
  },
  razorpayPaymentId: {
    type: String,
  },
  transactionId: {
    type: String,
  },
  paymentMethod: {
    type: String,
    enum: ["online", "cash", "cheque", "dd"],
    default: "online",
  },
  description: {
    type: String,
    required: true,
  },
  lateFee: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  finalAmount: {
    type: Number,
    required: true,
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  adminRemarks: {
    type: String,
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

// Indexes for better performance
courseFeesSchema.index({ studentId: 1, academicYear: 1 });
courseFeesSchema.index({ feeType: 1, paymentStatus: 1 });
courseFeesSchema.index({ dueDate: 1 });

// Generate receipt number before saving
courseFeesSchema.pre('save', function(next) {
  if (!this.receiptNumber && this.paymentStatus === 'paid') {
    this.receiptNumber = `CF${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  this.updatedAt = Date.now();
  next();
});

const CourseFees = mongoose.model("CourseFees", courseFeesSchema);
export default CourseFees;
