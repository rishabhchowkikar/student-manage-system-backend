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

// new controller function subjects by courseId
export const getSubjectsByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params; // Get courseId from URL parameters
    
    // Validate if courseId is provided
    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
        status: false
      });
    }

    // Find all subjects for the specific courseId with teacher information
    const subjects = await Subject.find({ courseId })
      .populate("teacherId", "name email department role")
      .populate("courseId", "name code department")
      .sort({ semester: 1, name: 1 }); // Sort by semester, then by subject name

    // Check if any subjects exist for this course
    if (!subjects || subjects.length === 0) {
      return res.status(404).json({
        message: "No subjects found for this course",
        status: false
      });
    }

    // Group subjects by semester for better organization
    const subjectsBySemester = subjects.reduce((acc, subject) => {
      const semester = subject.semester || 'Unassigned';
      if (!acc[semester]) {
        acc[semester] = [];
      }
      acc[semester].push(subject);
      return acc;
    }, {});

    // Calculate statistics
    const stats = {
      totalSubjects: subjects.length,
      totalSemesters: Object.keys(subjectsBySemester).filter(sem => sem !== 'Unassigned').length,
      assignedTeachers: [...new Set(subjects.map(s => s.teacherId?._id?.toString()).filter(Boolean))].length
    };

    res.status(200).json({
      data: subjects,
      subjectsBySemester, // Additional grouped data
      stats, // Subject statistics
      status: true,
      count: subjects.length,
      courseId: courseId,
      message: "Subjects fetched successfully for the course"
    });

  } catch (error) {
    console.error(`Error in getSubjectsByCourseId: ${error.message}`);
    res.status(500).json({
      message: "Server error while fetching subjects by course",
      status: false,
      error: error.message
    });
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

// updated teacher data controller function for specific subject
export const updateSubjectTeacher = async (req, res) => {
  try {
    const { id } = req.params; // Get subject ID from URL parameters
    const { teacherId } = req.body;

    // Validate if subject exists
    const existingSubject = await Subject.findById(id);
    if (!existingSubject) {
      return res.status(404).json({
        message: "Subject not found",
        status: false
      });
    }

    // Validate if the new teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(400).json({ 
        message: "Invalid teacher ID - Teacher not found", 
        status: false 
      });
    }

    // Update the subject with new teacher
    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      {
        teacherId: teacherId,
        updatedAt: new Date() // Track when it was last updated
      },
      { 
        new: true, // Return the updated document
        runValidators: true // Run schema validations
      }
    ).populate("teacherId", "name email department role");

    res.status(200).json({
      data: updatedSubject,
      status: true,
      message: `Teacher updated successfully for subject: ${updatedSubject.name}`
    });

  } catch (error) {
    console.error(`Error in updateSubjectTeacher: ${error.message}`);
    res.status(500).json({ 
      message: "Server error while updating subject teacher", 
      status: false 
    });
  }
};

// new controllers
// NEW - Update existing timetable function
export const updateTimeTable = async (req, res) => {
  try {
    const { id } = req.params; // Get timetable ID from URL parameters
    const { courseId, semester, schedule } = req.body;

    // Validate if timetable exists
    const existingTimeTable = await TimeTable.findById(id);
    if (!existingTimeTable) {
      return res.status(404).json({
        message: "TimeTable not found",
        status: false
      });
    }

    // Update the timetable with new data
    const updatedTimeTable = await TimeTable.findByIdAndUpdate(
      id,
      {
        courseId: courseId || existingTimeTable.courseId,
        semester: semester || existingTimeTable.semester,
        schedule: schedule || existingTimeTable.schedule,
        updatedAt: new Date() // Track when it was last updated
      },
      { 
        new: true, // Return the updated document
        runValidators: true // Run schema validations
      }
    ).populate({
      path: "schedule.periods.subjectId",
      populate: {
        path: "teacherId",
        select: "name email department",
        model: "Teacher"
      }
    });

    res.status(200).json({
      data: updatedTimeTable,
      status: true,
      message: "TimeTable updated successfully"
    });

  } catch (error) {
    console.error(`Error in updateTimeTable: ${error.message}`);
    res.status(500).json({ 
      message: "Server error while updating timetable", 
      status: false 
    });
  }
};


// NEW - Get timetable by ID (useful for admin to edit specific timetables)
export const getTimeTableById = async (req, res) => {
  try {
    const { id } = req.params;

    const timeTable = await TimeTable.findById(id).populate({
      path: "schedule.periods.subjectId",
      populate: {
        path: "teacherId",
        select: "name email department",
        model: "Teacher"
      }
    });

    if (!timeTable) {
      return res.status(404).json({
        message: "TimeTable not found",
        status: false
      });
    }

    res.status(200).json({
      data: timeTable,
      status: true,
      message: "TimeTable fetched successfully"
    });

  } catch (error) {
    console.error(`Error in getTimeTableById: ${error.message}`);
    res.status(500).json({
      message: "Server error while fetching timetable",
      status: false
    });
  }
};

// NEW - Get all timetables (for admin to see all timetables)
export const getAllTimeTables = async (req, res) => {
  try {
    const timeTables = await TimeTable.find({})
      .populate("courseId", "name code department")
      .populate({
        path: "schedule.periods.subjectId",
        populate: {
          path: "teacherId",
          select: "name email department",
          model: "Teacher"
        }
      })
      .sort({ createdAt: -1 });

    if (!timeTables || timeTables.length === 0) {
      return res.status(404).json({
        message: "No timetables found",
        status: false
      });
    }

    res.status(200).json({
      data: timeTables,
      status: true,
      count: timeTables.length,
      message: "TimeTables fetched successfully"
    });

  } catch (error) {
    console.error(`Error in getAllTimeTables: ${error.message}`);
    res.status(500).json({
      message: "Server error while fetching timetables",
      status: false
    });
  }
};

// NEW - Delete timetable function
export const deleteTimeTable = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTimeTable = await TimeTable.findByIdAndDelete(id);

    if (!deletedTimeTable) {
      return res.status(404).json({
        message: "TimeTable not found",
        status: false
      });
    }

    res.status(200).json({
      message: "TimeTable deleted successfully",
      status: true,
      data: deletedTimeTable
    });

  } catch (error) {
    console.error(`Error in deleteTimeTable: ${error.message}`);
    res.status(500).json({
      message: "Server error while deleting timetable",
      status: false
    });
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

export const getAllStudents = async (req, res) => {
  try {

    const students = await Auth.find({})
      .populate("courseId", "name code duration department")
      .select("-password") 
      .sort({ createdAt: -1 }); 

    // Check if any students exist
    if (!students || students.length === 0) {
      return res.status(404).json({ 
        message: "No students found", 
        status: false 
      });
    }

    res.status(200).json({ 
      data: students, 
      status: true,
      count: students.length,
      message: "Students fetched successfully"
    });
  } catch (error) {
    console.error(`Error in getAllStudents: ${error.message}`);
    res.status(500).json({ 
      message: "Server error while fetching students", 
      status: false 
    });
  }
};

// Get timetables by courseId (all semesters for a specific course)
export const getTimeTablesByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params; // Get courseId from URL parameters
    
    // Validate if courseId is provided
    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
        status: false
      });
    }

    // Find all timetables for the specific courseId
    const timeTables = await TimeTable.find({ courseId })
      .populate("courseId", "name code department")
      .populate({
        path: "schedule.periods.subjectId",
        populate: {
          path: "teacherId",
          select: "name email department",
          model: "Teacher"
        }
      })
      .sort({ semester: 1 }); // Sort by semester in ascending order

    // Check if any timetables exist for this course
    if (!timeTables || timeTables.length === 0) {
      return res.status(404).json({
        message: "No timetables found for this course",
        status: false
      });
    }

    // Group timetables by semester for better organization
    const timetablesBySemester = timeTables.reduce((acc, timetable) => {
      const semester = timetable.semester;
      if (!acc[semester]) {
        acc[semester] = [];
      }
      acc[semester].push(timetable);
      return acc;
    }, {});

    res.status(200).json({
      data: timeTables,
      timetablesBySemester, // Additional grouped data
      status: true,
      count: timeTables.length,
      courseId: courseId,
      message: "Timetables fetched successfully for the course"
    });

  } catch (error) {
    console.error(`Error in getTimeTablesByCourseId: ${error.message}`);
    res.status(500).json({
      message: "Server error while fetching timetables by course",
      status: false
    });
  }
};
