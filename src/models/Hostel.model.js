import mongoose from "mongoose";

const hostelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentPersonalDetail",
    required: true,
  },
  roomType: { type: String, enum: ["Normal", "AC"], required: true },
  roomNumber: { type: String, required: true },
  floor: { type: String, required: true },
  hostelName: { type: String, required: true },
  allocated: { type: Boolean, default: false },
  
  // Payment related fields
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid", "failed"], 
    default: "pending" 
  },
  paymentAmount: { type: Number, required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paymentDate: { type: Date },
  
  // Admin notification
  adminNotified: { type: Boolean, default: false },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Hostel = mongoose.model("Hostel", hostelSchema);
export default Hostel;