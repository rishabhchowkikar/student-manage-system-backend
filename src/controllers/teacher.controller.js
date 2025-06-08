import Teacher from "../models/Teacher.model.js";
import Subject from "../models/Subject.model.js";
import TimeTable from "../models/TimeTable.model.js";

export const getProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user._id).select("-password");
    if (!teacher) {
      return res
        .status(404)
        .json({ message: "Teacher not found", status: false });
    }
    res.json({
      data: { ...teacher.toObject(), role: req.user.role },
      status: true,
    });
  } catch (error) {
    console.error(`Error in getProfile Teachere: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const getTimeTable = async (req, res) => {
  try {
    const subjects = await Subject.find({ teacherId: req.user._id }).populate(
      "courseId"
    );
    const timetables = await Promise.all(
      subjects.map(async (subject) => {
        const timetable = await TimeTable.findOne({
          courseId: subject.courseId,
          semester: subject.semester,
        }).populate("schedule.periods.subjectId");
        return timetable;
      })
    );
    res.json({ data: timetables.filter(Boolean), status: true });
  } catch (error) {
    console.error(`Error in getTimetable Teacher: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};
