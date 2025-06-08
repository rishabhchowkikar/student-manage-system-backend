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
});

const Hostel = mongoose.model("Hostel", hostelSchema);
export default Hostel;
