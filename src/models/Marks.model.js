import mongoose from "mongoose";

const marksSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentPersonalDetail",
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  semester: { type: Number, required: true },
  internalMarks: { type: Number, default: 0 },
});

const Marks = mongoose.model("Marks", marksSchema);
export default Marks;
