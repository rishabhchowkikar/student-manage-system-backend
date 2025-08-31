import mongoose from "mongoose";

const buildingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["boys", "girls"], required: true },
  totalFloors: { type: Number, required: true, default: 3 },
  

  floorConfig: {
    groundFloor: {
      totalRooms: { type: Number, default: 20 }, 
      roomPrefix: { type: String, default: "0" } 
    },
    upperFloors: {
      leftCorridor: { type: Number, default: 20 }, 
      rightCorridor: { type: Number, default: 20 },
      roomPrefixLeft: { type: String, default: "L" }, 
      roomPrefixRight: { type: String, default: "R" } 
    }
  },
  
  address: { type: String },
  wardenName: { type: String },
  wardenPhone: { type: String },
  caretakerName: { type: String },
  caretakerPhone: { type: String },
  
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Building = mongoose.model("Building", buildingSchema);
export default Building;
