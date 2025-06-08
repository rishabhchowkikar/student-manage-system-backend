import Marks from "../models/Marks.model.js";
import Attendance from "../models/Attendance.model.js";
import Subject from "../models/Subject.model.js";
import StudentPersonalDetail from "../models/auth.model.js";

export const uploadClassAttendance = async (req, res) => {
  try {
    const { subjectId, semester, attendance } = req.body;
    const subject = await Subject.findById(subjectId);
    if (!subject || subject.teacherId.toString() !== req.user._id) {
      return res.status(403).json({
        message: "Not authorized to update attendance for this subject",
        status: false,
      });
    }

    for (const { studentId, totalClasses, attendedClasses } of attendance) {
      const percentage = (attendedClasses / totalClasses) * 100;
      await Attendance.findOneAndUpdate(
        { studentId, subjectId, semester },
        { totalClasses, attendedClasses, percentage },
        { upsert: true, new: true }
      );
    }

    res.json({ message: "Attendance updated successfully", status: true });
  } catch (error) {
    console.error(`Error in uploadClassAttendance: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const getStudentMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ studentId: req.user._id }).populate(
      "subjectId"
    );
    res.json({ data: marks, status: true });
  } catch (error) {
    console.error(`Error in getStudentMarks: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      studentId: req.user._id,
    }).populate("subjectId");
    res.json({ data: attendance, status: true });
  } catch (error) {
    console.error(`Error in getStudentAttendance: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const getClassList = async (req, res) => {
  try {
    const { subjectId } = req.query;
    const subject = await Subject.findById(subjectId);
    if (!subject || subject.teacherId.toString() !== req.user._id) {
      return res
        .status(403)
        .json({
          message: "Not authorized to access this subject",
          status: false,
        });
    }

    const students = await StudentPersonalDetail.find({
      courseId: subject.courseId,
    });
    res.json({ data: students, status: true });
  } catch (error) {
    console.error(`Error in getClassList: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};
