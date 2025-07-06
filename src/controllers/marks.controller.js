import Marks from "../models/Marks.model.js";
import Attendance from "../models/Attendance.model.js";
import Subject from "../models/Subject.model.js";
import Admin from "../models/Admin.model.js";

export const uploadClassAttendance = async (req, res) => {
  try {
    const { subjectId, semester, attendance } = req.body;

    // Validate request body
    if (!subjectId || !semester || !attendance || !Array.isArray(attendance) || attendance.length === 0) {
      return res.status(400).json({ message: "Subject ID, semester, and attendance array are required", status: false });
    }

    // Verify that the subject exists and the teacher is authorized
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found", status: false });
    }

    if (subject.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update attendance for this subject", status: false });
    }

    // Validate semester matches the subject's semester
    if (subject.semester !== semester) {
      return res.status(400).json({ message: "Semester does not match the subject's semester", status: false });
    }

    // Validate that all students exist and are enrolled in the subject's course
    const studentIds = attendance.map((entry) => entry.studentId);
    const students = await Admin.find({ _id: { $in: studentIds }, courseId: subject.courseId });
    const validStudentIds = students.map((student) => student._id.toString());

    const updatedAttendance = []; // Array to store updated or created attendance

    for (const entry of attendance) {
      const { studentId, totalClasses, attendedClasses } = entry;

      // Validate studentId, totalClasses, and attendedClasses
      if (!studentId || totalClasses === undefined || attendedClasses === undefined) {
        return res.status(400).json({ message: "Each attendance entry must include studentId, totalClasses, and attendedClasses", status: false });
      }

      // Check if the student exists and is enrolled in the course
      if (!validStudentIds.includes(studentId.toString())) {
        return res.status(400).json({ message: `Student with ID ${studentId} not found or not enrolled in the course`, status: false });
      }

      // Validate totalClasses and attendedClasses
      if (typeof totalClasses !== "number" || totalClasses <= 0) {
        return res.status(400).json({ message: `Invalid totalClasses for student ${studentId}: must be a positive number`, status: false });
      }
      if (typeof attendedClasses !== "number" || attendedClasses < 0 || attendedClasses > totalClasses) {
        return res.status(400).json({ message: `Invalid attendedClasses for student ${studentId}: must be between 0 and totalClasses`, status: false });
      }

      // Calculate percentage
      const percentage = (attendedClasses / totalClasses) * 100;

      // Update or create the attendance entry and store the result
      const updatedEntry = await Attendance.findOneAndUpdate(
        { studentId, subjectId, semester },
        { totalClasses, attendedClasses, percentage },
        { upsert: true, new: true }
      );
      updatedAttendance.push(updatedEntry);
    }

    res.status(200).json({
      data: updatedAttendance,
      message: "Attendance updated successfully",
      status: true
    });
  } catch (error) {
    console.error(`Error in uploadClassAttendance: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};


export const uploadClassMarks = async (req, res) => {
  try {
    const { subjectId, semester, marks } = req.body;

    // Validate request body
    if (!subjectId || !semester || !marks || !Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({ message: "Subject ID, semester, and marks array are required", status: false });
    }

    // Verify that the subject exists and the teacher is authorized
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found", status: false });
    }

    if (subject.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update marks for this subject", status: false });
    }

    // Validate semester matches the subject's semester
    if (subject.semester !== semester) {
      return res.status(400).json({ message: "Semester does not match the subject's semester", status: false });
    }

    // Validate that all students exist and are enrolled in the subject's course
    const studentIds = marks.map((mark) => mark.studentId);
    const students = await Admin.find({ _id: { $in: studentIds }, courseId: subject.courseId });
    const validStudentIds = students.map((student) => student._id.toString());

    const updatedMarks = []; // Array to store updated or created marks

    for (const mark of marks) {
      const { studentId, internalMarks } = mark;

      // Validate studentId and internalMarks
      if (!studentId || internalMarks === undefined) {
        return res.status(400).json({ message: "Each mark entry must include studentId and internalMarks", status: false });
      }

      // Check if the student exists and is enrolled in the course
      if (!validStudentIds.includes(studentId.toString())) {
        return res.status(400).json({ message: `Student with ID ${studentId} not found or not enrolled in the course`, status: false });
      }

      // Validate internalMarks
      if (typeof internalMarks !== "number" || internalMarks < 0 || internalMarks > 100) {
        return res.status(400).json({ message: `Invalid internalMarks for student ${studentId}: must be a number between 0 and 100`, status: false });
      }

      // Update or create the marks entry and store the result
      const updatedMark = await Marks.findOneAndUpdate(
        { studentId, subjectId, semester },
        { internalMarks },
        { upsert: true, new: true }
      );
      updatedMarks.push(updatedMark);
    }

    res.status(200).json({ data: updatedMarks,message:"Marks Updated Successfully", status: true });
  } catch (error) {
    console.error(`Error in uploadClassMarks: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};


export const updateClassMarks = async (req, res) => {
  try {
    const { studentId, subjectId, semester, internalMarks } = req.body;

    // Validate request body
    if (!studentId || !subjectId || !semester || internalMarks === undefined) {
      return res.status(400).json({ message: "studentId, subjectId, semester, and internalMarks are required", status: false });
    }

    // Verify that the subject exists and the teacher is authorized
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found", status: false });
    }

    if (subject.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update marks for this subject", status: false });
    }

    // Validate semester matches the subject's semester
    if (subject.semester !== semester) {
      return res.status(400).json({ message: "Semester does not match the subject's semester", status: false });
    }

    // Validate that the student exists and is enrolled in the subject's course
    const student = await Admin.findOne({ _id: studentId, courseId: subject.courseId });
    if (!student) {
      return res.status(400).json({ message: `Student with ID ${studentId} not found or not enrolled in the course`, status: false });
    }

    // Validate internalMarks
    if (typeof internalMarks !== "number" || internalMarks < 0 || internalMarks > 100) {
      return res.status(400).json({ message: "internalMarks must be a number between 0 and 100", status: false });
    }

    // Find and update the marks entry (no upsert, must exist)
    const updatedMark = await Marks.findOneAndUpdate(
      { studentId, subjectId, semester },
      { internalMarks },
      { new: true }
    );

    if (!updatedMark) {
      return res.status(404).json({ message: "Marks entry not found", status: false });
    }

    res.status(200).json({ data: updatedMark, status: true });
  } catch (error) {
    console.error(`Error in updateClassMarks: ${error.message}`);
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

// export const getClassList = async (req, res) => {
//   try {
//     const { subjectId } = req.query;
//     const subject = await Subject.findById(subjectId);
//     if (!subject || subject.teacherId.toString() !== req.user._id) {
//       return res
//         .status(403)
//         .json({
//           message: "Not authorized to access this subject",
//           status: false,
//         });
//     }

//     const students = await Admin.find({
//       courseId: subject.courseId,
//     });
//     res.json({ data: students, status: true });
//   } catch (error) {
//     console.error(`Error in getClassList: ${error.message}`);
//     res.status(500).json({ message: "Server error", status: false });
//   }
// };

export const getClassList = async (req, res) => {
  try {
    const { subjectId } = req.query;

    // Verify that the subject exists and the teacher is authorized
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found", status: false });
    }

    if (subject.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to access this subject", status: false });
    }

    // Fetch students enrolled in the course associated with the subject
    const students = await Admin.find({ courseId: subject.courseId }).select(
      "-password"
    );

    res.status(200).json({ data: students, status: true });
  } catch (error) {
    console.error(`Error in getClassList: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};