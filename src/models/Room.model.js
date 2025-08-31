import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  buildingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Building", 
    required: true 
  },
  roomNumber: { type: String, required: true },
  displayName: { type: String, required: true }, 
  floor: { type: Number, required: true }, 
  corridor: { 
    type: String, 
    enum: ["ground", "left", "right"], 
    required: true 
  },
  roomType: { type: String, enum: ["Normal", "AC"], required: true },
  capacity: { type: Number, default: 3 }, 
  currentOccupancy: { type: Number, default: 0 },
  

  occupants: [{
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "StudentPersonalDetail" 
    },
    allocatedDate: { type: Date, default: Date.now },
    academicYear: { type: String, required: true }
  }],
  
  isActive: { type: Boolean, default: true },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
roomSchema.index({ buildingId: 1, floor: 1, corridor: 1 });
roomSchema.index({ buildingId: 1, isActive: 1, currentOccupancy: 1 });

const Room = mongoose.model("Room", roomSchema);
export default Room;
