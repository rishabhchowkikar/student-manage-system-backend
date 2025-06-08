import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentPersonalDetail",
    required: true,
  },
  semester: { type: Number, required: true },
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
  },
});

const Exam = mongoose.model("Exam", examSchema);
export default Exam;
