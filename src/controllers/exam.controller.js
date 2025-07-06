import Exam from "../models/Exam.model.js";
import Subject from "../models/Subject.model.js";
import Auth from "../models/Auth.model.js";

// Student submits the exam form
export const submitExamForm = async (req, res) => {
  try {
    const { semester, currentSession, type, month } = req.body;

    // Validate request body
    if (!semester || !currentSession || !type || !month) {
      return res.status(400).json({ message: "semester, currentSession, type, and month are required", status: false });
    }

    // Validate enum values
    if (!["Regular", "Backlog"].includes(type)) {
      return res.status(400).json({ message: "Type must be 'Regular' or 'Backlog'", status: false });
    }
    if (!["June-July", "September-November"].includes(month)) {
      return res.status(400).json({ message: "Month must be 'June-July' or 'September-November'", status: false });
    }

    // Get the student's details
    const student = await Auth.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ message: "Student not found", status: false });
    }

    // Fetch subjects for the student's course and semester
    const subjects = await Subject.find({ courseId: student.courseId, semester });
    if (subjects.length === 0) {
      return res.status(404).json({ message: "No subjects found for this course and semester", status: false });
    }

    // Prepare subjects array for the exam form
    const examSubjects = subjects.map(subject => ({
      subjectId: subject._id,
      earlierMarks: 0, // Default value, can be updated later for backlogs
    }));

    // Create the exam form
    const examForm = new Exam({
      studentId: req.user._id,
      semester,
      currentSession,
      type,
      month,
      subjects: examSubjects,
      examRegistration: {
        isAllowed: true,
        isSubmitted: true,
        registrationDate: new Date(), // Current date/time
      },
    });

    await examForm.save();

    res.status(201).json({
      data: examForm,
      message: "Exam form submitted successfully",
      status: true,
    });
  } catch (error) {
    console.error(`Error in submitExamForm: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Admin verifies the exam form
export const verifyExamForm = async (req, res) => {
  try {
    const { examId } = req.params;

    // Find the exam form
    const examForm = await Exam.findById(examId);
    if (!examForm) {
      return res.status(404).json({ message: "Exam form not found", status: false });
    }

    // Update verification status and enable hall ticket
    examForm.examRegistration.isVerified = true;
    examForm.examRegistration.hallTicketAvailable = true;
    await examForm.save();

    res.status(200).json({
      data: examForm,
      message: "Exam form verified successfully",
      status: true,
    });
  } catch (error) {
    console.error(`Error in verifyExamForm: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Student retrieves their exam form details
export const getExamFormDetails = async (req, res) => {
  try {
    const examForms = await Exam.find({ studentId: req.user._id })
      .populate("subjects.subjectId")
      .populate({
        path: "studentId",
        select: "-password", 
      });

    res.status(200).json({
      data: examForms,
      status: true,
    });
  } catch (error) {
    console.error(`Error in getExamFormDetails: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};