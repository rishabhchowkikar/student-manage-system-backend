import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  school: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true, // e.g., "BTECH", "BED"
  },
  duration: {
    type: Number,
    required: true, // Duration in years (e.g., 4 for B.Tech, 2 for B.Ed)
    min: 1,
  },
  totalSemesters: {
    type: Number,
    required: true, // Total semesters (e.g., 8 for a 4-year B.Tech)
    min: 1,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
    assignedTeachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
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

// Middleware to update the updatedAt field on save
courseSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Course = mongoose.model("Course", courseSchema);
export default Course;
