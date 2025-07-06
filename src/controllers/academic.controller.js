import Subject from "../models/Subject.model.js";
import TimeTable from "../models/TimeTable.model.js";
import Auth from "../models/Auth.model.js";
import Teacher from "../models/Teacher.model.js";


// this will create the subject in the db
export const createSubject = async (req, res) => {
  try {
    const { code, name, courseId, semester, teacherId } = req.body;
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res
        .status(400)
        .json({ message: "Invalid teacher ID", status: false });
    }
    const subject = new Subject({ code, name, courseId, semester, teacherId });
    await subject.save();
    res.status(201).json({ data: subject, status: true });
  } catch (error) {
    console.error(`Error in createSubject: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const getSubjects = async (req, res) => {
  try {
    const student = await Auth.findById(req.user._id);
    const subjects = await Subject.find({
      courseId: student.courseId,
    }).populate("teacherId", "name email");
    res.json({ data: subjects, status: true });
  } catch (error) {
    console.error(`Error in getSubjects: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().select("name email department role");
    res.json({ data: teachers, status: true });
  } catch (error) {
    console.error(`Error in getTeachers: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const createTimeTable = async (req, res) => {
  try {
    const { courseId, semester, schedule } = req.body;
    const timeTable = new TimeTable({ courseId, semester, schedule });
    await timeTable.save();
    res.status(201).json({ data: timeTable, status: true });
  } catch (error) {
    console.error(`Error in createTimeTable: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const getTimeTable = async (req, res) => {
  try {
    const student = await Auth.findById(req.user._id);

    const timeTable = await TimeTable.findOne({
      courseId: student.courseId,
    }).populate({
      path: "schedule.periods.subjectId",
      populate: {
        path: "teacherId",
        select: "name email department",
        model: "Teacher"
      }
  });
    res.json({ data: timeTable, status: true });
  } catch (error) {
    console.error(`Error in getTimeTable: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};
