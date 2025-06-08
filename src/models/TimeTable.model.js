import mongoose from "mongoose";

const timeTableSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  semester: { type: Number, required: true },
  schedule: [
    {
      day: { type: String, required: true },
      periods: [
        {
          time: { type: String, required: true },
          subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true,
          },
        },
      ],
    },
  ],
});

const TimeTable = mongoose.model("TimeTable", timeTableSchema);
export default TimeTable;
