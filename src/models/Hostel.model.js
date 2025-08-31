import mongoose from "mongoose";

const hostelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentPersonalDetail",
    required: true,
  },

   buildingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Building" 
  },
  roomId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Room" 
  },


  roomType: { type: String, enum: ["Normal", "AC"], required: true },
  roomNumber: { type: String, required: true },
  floor: { type: String, required: true },
  hostelName: { type: String, required: true },
  allocated: { type: Boolean, default: false },
  
 allocationDate: { type: Date },
  academicYear: { 
    type: String, 
    required: true,
  },
  

  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid", "failed"], 
    default: "pending" 
  },
  paymentAmount: { type: Number, required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paymentDate: { type: Date },
  

  adminNotified: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add compound index for efficient queries
hostelSchema.index({ userId: 1, academicYear: 1 });
hostelSchema.index({ buildingId: 1, roomId: 1, academicYear: 1 });

const Hostel = mongoose.model("Hostel", hostelSchema);
export default Hostel;