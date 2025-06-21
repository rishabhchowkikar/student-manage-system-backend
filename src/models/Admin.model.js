import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
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
  role: { type: String, default: "admin" },
  createdAt: { type: Date, default: Date.now },
});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
