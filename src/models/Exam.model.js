import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentPersonalDetail",
    required: true,
  },
  semester: { type: Number, required: true },
  currentSession: { type: String, required: true }, // e.g., "2025-2026"
  type: { type: String, enum: ["Regular", "Backlog"], required: true }, // e.g., "Regular"
  month: { type: String, enum: ["June-July", "September-November"], required: true }, // e.g., "June-July"
  subjects: [
    {
      subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
      },
      earlierMarks: { type: Number, default: 0 },
    },
  ],
  examRegistration: {
    isAllowed: { type: Boolean, default: true },
    isSubmitted: { type: Boolean, default: false },
    registrationDate: { type: Date },
    isVerified: { type: Boolean, default: false }, 
    hallTicketAvailable: { type: Boolean, default: false }, 
  },
});

const Exam = mongoose.model("Exam", examSchema);
export default Exam;