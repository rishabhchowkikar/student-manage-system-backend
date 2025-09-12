import Exam from "../models/Exam.model.js";
import Subject from "../models/Subject.model.js";
import Auth from "../models/Auth.model.js";
import mongoose from "mongoose";

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

// new controller method only for admin
// get all submitted exam forms with complete details
export const getAllSubmittedExamForms = async (req, res) => {
  try {
    const { semester, currentSession, type, courseId, isVerified } = req.query;
    
    // Build query filter
    let query = { 'examRegistration.isSubmitted': true };
    
    if (semester) query.semester = parseInt(semester);
    if (currentSession) query.currentSession = currentSession;
    if (type) query.type = type;
    if (isVerified !== undefined) query['examRegistration.isVerified'] = isVerified === 'true';
    
    const examForms = await Exam.find(query)
      .populate({
        path: 'studentId',
        select: 'name rollno email courseId',
        populate: { 
          path: 'courseId', 
          select: 'name code department school' 
        }
      })
      .populate('subjects.subjectId', 'name code')
      .sort({ 'examRegistration.registrationDate': -1 });
    
    // Filter by courseId if provided
    let filteredForms = examForms;
    if (courseId) {
      filteredForms = examForms.filter(form => 
        form.studentId?.courseId?._id?.toString() === courseId
      );
    }
    
    const summary = {
      total: filteredForms.length,
      verified: filteredForms.filter(form => form.examRegistration.isVerified).length,
      pending: filteredForms.filter(form => !form.examRegistration.isVerified).length,
      hallTicketAvailable: filteredForms.filter(form => form.examRegistration.hallTicketAvailable).length
    };
    
    res.status(200).json({ 
      data: filteredForms, 
      summary,
      status: true,
      message: "All exam forms fetched successfully"
    });
  } catch (error) {
    console.error('Error fetching exam forms:', error);
    res.status(500).json({ message: 'Server error', status: false });
  }
};

// Bulk verify exam forms by course
export const bulkVerifyExamForms = async (req, res) => {
  try {
    const { courseId, semester, currentSession } = req.body;
    
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ 
        message: 'Valid courseId is required', 
        status: false 
      });
    }
    
    // Find all students of this course
    const students = await Auth.find({ courseId }).select('_id');
    const studentIds = students.map(s => s._id);
    
    // Build query for exam forms
    let query = { 
      studentId: { $in: studentIds }, 
      'examRegistration.isSubmitted': true 
    };
    
    if (semester) query.semester = parseInt(semester);
    if (currentSession) query.currentSession = currentSession;
    
    // Update verification status
    const result = await Exam.updateMany(
      query,
      { 
        $set: { 'examRegistration.isVerified': true } 
      }
    );
    
    res.status(200).json({
      message: `Bulk verification completed for course. Records updated: ${result.modifiedCount}`,
      modifiedCount: result.modifiedCount,
      status: true
    });
  } catch (error) {
    console.error('Error in bulk verification:', error);
    res.status(500).json({ message: 'Server error', status: false });
  }
};

// Verify exam form by studentId
export const verifyExamFormByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ 
        message: 'Valid studentId is required', 
        status: false 
      });
    }
    
    // Update all exam forms for this student
    const result = await Exam.updateMany(
      { 
        studentId,
        'examRegistration.isSubmitted': true 
      },
      { 
        $set: { 'examRegistration.isVerified': true } 
      }
    );
    
    const student = await Auth.findById(studentId).select('name rollno');
    
    res.status(200).json({
      message: `Exam forms verified for student ${student?.name} (${student?.rollno}). Records updated: ${result.modifiedCount}`,
      modifiedCount: result.modifiedCount,
      status: true
    });
  } catch (error) {
    console.error('Error verifying by studentId:', error);
    res.status(500).json({ message: 'Server error', status: false });
  }
};

// Enable hall tickets for all students in a course (but preserve individual holds)
export const enableHallTicketsForCourse = async (req, res) => {
  try {
    const { courseId, semester, currentSession } = req.body;
    
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ 
        message: 'Valid courseId is required', 
        status: false 
      });
    }
    
    // Find all students of this course
    const students = await Auth.find({ courseId }).select('_id');
    const studentIds = students.map(s => s._id);
    
    // Build query for exam forms
    let query = { 
      studentId: { $in: studentIds }, 
      'examRegistration.isSubmitted': true,
      'examRegistration.isVerified': true  // Only for verified forms
    };
    
    if (semester) query.semester = parseInt(semester);
    if (currentSession) query.currentSession = currentSession;
    
    // Update hall ticket availability
    const result = await Exam.updateMany(
      query,
      { 
        $set: { 'examRegistration.hallTicketAvailable': true } 
      }
    );
    
    res.status(200).json({
      message: `Hall tickets enabled for course. Records updated: ${result.modifiedCount}`,
      modifiedCount: result.modifiedCount,
      status: true
    });
  } catch (error) {
    console.error('Error enabling hall tickets:', error);
    res.status(500).json({ message: 'Server error', status: false });
  }
};

// Hold hall ticket for specific student
export const holdHallTicketForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ 
        message: 'Valid studentId is required', 
        status: false 
      });
    }
    
    // Update all exam forms for this student - set hall ticket to false
    const result = await Exam.updateMany(
      { studentId },
      { 
        $set: { 'examRegistration.hallTicketAvailable': false } 
      }
    );
    
    const student = await Auth.findById(studentId).select('name rollno');
    
    res.status(200).json({
      message: `Hall ticket held for student ${student?.name} (${student?.rollno}). Records updated: ${result.modifiedCount}`,
      modifiedCount: result.modifiedCount,
      status: true
    });
  } catch (error) {
    console.error('Error holding hall ticket:', error);
    res.status(500).json({ message: 'Server error', status: false });
  }
};

// update the hall ticket for a specific student
export const enableHallTicketForStudent = async (req, res) => {
  try {
    const { studentId, courseId, semester } = req.body;
    
    // Validate inputs
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ 
        message: 'Valid studentId is required', 
        status: false 
      });
    }
    
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ 
        message: 'Valid courseId is required', 
        status: false 
      });
    }
    
    if (!semester || typeof semester !== 'number') {
      return res.status(400).json({ 
        message: 'Valid semester number is required', 
        status: false 
      });
    }
    
    // Find and verify the student belongs to the specified course
    const student = await Auth.findOne({ 
      _id: studentId, 
      courseId: courseId 
    }).select('name rollno');
    
    if (!student) {
      return res.status(404).json({
        message: 'Student not found in the specified course',
        status: false
      });
    }
    
    // Update exam forms for the specific student, course, and semester
    const result = await Exam.updateMany(
      {
        studentId: studentId,
        semester: semester,
        'examRegistration.isSubmitted': true,
        'examRegistration.isVerified': true  // Only enable for verified forms
      },
      {
        $set: { 'examRegistration.hallTicketAvailable': true }
      }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({
        message: 'No verified exam forms found for this student and semester',
        status: false
      });
    }
    
    res.status(200).json({
      message: `Hall ticket enabled for student ${student.name} (${student.rollno}) for semester ${semester}`,
      modifiedCount: result.modifiedCount,
      student: {
        name: student.name,
        rollno: student.rollno
      },
      status: true
    });
    
  } catch (error) {
    console.error('Error enabling hall ticket for student:', error);
    res.status(500).json({ 
      message: 'Server error', 
      status: false 
    });
  }
};