import StudentPersonalDetail from "../models/auth.model.js";
import Course from "../models/course.model.js";
import Teacher from "../models/Teacher.model.js";
import mongoose from "mongoose";

export const addCourse = async (req, res) => {
  try {
    const { name, department, school, code, duration, description } = req.body;

    // Validate required fields
    if (!name || !department || !school || !code || !duration) {
      return res.status(400).json({
        message: "name, department, school, code, and duration are required",
        status: false,
      });
    }

    // Validate duration
    if (typeof duration !== "number" || duration < 1) {
      return res.status(400).json({
        message: "duration must be a number greater than or equal to 1",
        status: false,
      });
    }

    // Calculate total semesters (assuming 2 semesters per year)
    const totalSemesters = duration * 2;

    // Validate course, department, and school combination
    const validCombinations = {
      "Bachelor of Technology": {
        departments: [
          "Computer Science",
          "Chemical Engineering",
          "Mechanical Engineering",
        ],
        school: "School of Engineering",
      },
      "Bachelor of Education": {
        departments: ["Education"],
        school: "School of Education",
      },
      "Master of Technology": {
        departments: [
          "Computer Science",
          "Chemical Engineering",
          "Mechanical Engineering",
        ],
        school: "School of Engineering",
      },
      "Master of Education": {
        departments: ["Education"],
        school: "School of Education",
      },
    };

    if (!validCombinations[name]) {
      return res.status(400).json({
        message: `Invalid course name: ${name}`,
        status: false,
      });
    }

    if (!validCombinations[name].departments.includes(department)) {
      return res.status(400).json({
        message: `Department ${department} is not valid for course ${name}`,
        status: false,
      });
    }

    if (validCombinations[name].school !== school) {
      return res.status(400).json({
        message: `School ${school} is not valid for course ${name}. It must be ${validCombinations[name].school}`,
        status: false,
      });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({
        message: `Course with code ${code} already exists`,
        status: false,
      });
    }

    // Create the new course
    const newCourse = new Course({
      name,
      department,
      school,
      code,
      duration,
      totalSemesters,
      description: description || "",
      createdBy: req.user._id, // From authMiddleware
    });

    await newCourse.save();

    res.status(201).json({
      data: newCourse,
      message: "Course added successfully",
      status: true,
    });
  } catch (error) {
    console.error(`Error in addCourse: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// export const getCourseDetails = async (req, res) => {
//   try {
//     const { courseId } = req.query; // Optional query parameter ?courseId=

//     if (req.user.role === "admin") {
//       // Admins can fetch any course or all courses
//       if (courseId) {
//         // Validate courseId format
//         if (!mongoose.Types.ObjectId.isValid(courseId)) {
//           return res.status(400).json({ message: "Invalid courseId format", status: false });
//         }

//         const course = await Course.findById(courseId)
//           .populate("assignedTeachers", "name email")
//           .populate("createdBy", "name email");
        
//         if (!course) {
//           return res.status(404).json({ message: "Course not found", status: false });
//         }

//         res.status(200).json({ data: course, status: true });
//       } else {
//         // Fetch all courses
//         const courses = await Course.find({})
//           .populate("assignedTeachers", "name email")
//           .populate("createdBy", "name email");
        
//         res.status(200).json({ data: courses, status: true });
//       }
//     } else if (req.user.role === "student") {
//       // Students can only fetch their enrolled course
//       if (!courseId) {
//         return res.status(400).json({ message: "courseId is required for students", status: false });
//       }

//       // Validate courseId format
//       if (!mongoose.Types.ObjectId.isValid(courseId)) {
//         return res.status(400).json({ message: "Invalid courseId format", status: false });
//       }

//       // Check if the student is enrolled in the course
//       const student = await StudentPersonalDetail.findById(req.user._id);
//       if (!student) {
//         return res.status(404).json({ message: "Student not found", status: false });
//       }

//       if (student.courseId.toString() !== courseId) {
//         return res.status(403).json({ message: "You are not enrolled in this course", status: false });
//       }

//       const course = await Course.findById(courseId)
//         .populate("assignedTeachers", "name email");
      
//       if (!course) {
//         return res.status(404).json({ message: "Course not found", status: false });
//       }

//       res.status(200).json({ data: course, status: true });
//     } else if (req.user.role === "teacher") {
//       // Teachers can only fetch courses they are assigned to
//       if (!courseId) {
//         return res.status(400).json({ message: "courseId is required for teachers", status: false });
//       }

//       // Validate courseId format
//       if (!mongoose.Types.ObjectId.isValid(courseId)) {
//         return res.status(400).json({ message: "Invalid courseId format", status: false });
//       }

//       const course = await Course.findOne({
//         _id: courseId,
//         assignedTeachers: req.user._id,
//       }).populate("assignedTeachers", "name email");

//       if (!course) {
//         return res.status(403).json({
//           message: "Course not found or you are not assigned to this course",
//           status: false,
//         });
//       }

//       res.status(200).json({ data: course, status: true });
//     } else {
//       return res.status(403).json({ message: "Access denied", status: false });
//     }
//   } catch (error) {
//     console.error(`Error in getCourseDetails: ${error.message}`);
//     res.status(500).json({ message: "Server error", status: false });
//   }
// };


export const getCourseDetails = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      // Admins can fetch all courses or a specific course via query parameter
      const { courseId } = req.query; // Optional: ?courseId=someId
      if (courseId) {
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
          return res.status(400).json({ message: "Invalid courseId format", status: false });
        }
        const course = await Course.findById(courseId)
          .populate("assignedTeachers", "name email phone")
          .populate("createdBy", "name email phone");
        if (!course) {
          return res.status(404).json({ message: "Course not found", status: false });
        }
        return res.status(200).json({ data: course, status: true });
      } else {
        const courses = await Course.find({})
          .populate("assignedTeachers", "name email phone")
          .populate("createdBy", "name email phone");
        return res.status(200).json({ data: courses, status: true });
      }
    } else if (req.user.role === "student") {
      // Students get their enrolled course from req.user.courseId
      const { courseId } = req.user; // Assume courseId is part of req.user
      if (!courseId) {
        return res.status(404).json({ message: "No enrolled course found", status: false });
      }
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: "Invalid courseId format", status: false });
      }
      const course = await Course.findById(courseId)
        .populate("assignedTeachers", "name email phone");
      if (!course) {
        return res.status(404).json({ message: "Course not found", status: false });
      }
      return res.status(200).json({ data: course, status: true });
    } else if (req.user.role === "teacher") {
      // Teachers get all courses they are assigned to, excluding sensitive fields
      const courses = await Course.find({ assignedTeachers: req.user._id })
        .populate("assignedTeachers", "name email phone")
        .populate("createdBy", "name email phone");
      if (!courses.length) {
        return res.status(403).json({ message: "No courses assigned to you", status: false });
      }
      // Filter out assignedTeachers and createdBy from the response
      const filteredCourses = courses.map(course => {
        const { assignedTeachers, createdBy, ...rest } = course.toObject();
        return rest;
      });
      return res.status(200).json({ data: filteredCourses, status: true });
    } else {
      return res.status(403).json({ message: "Access denied", status: false });
    }
  } catch (error) {
    console.error(`Error in getCourseDetails: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const updateAssignedTeachers = async (req, res) => {
  try {
    const { courseId, teacherIds } = req.body;

    // Validate required fields
    if (!courseId) {
      return res.status(400).json({ message: "courseId is required", status: false });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId format", status: false });
    }

    // Validate teacherIds
    if (!Array.isArray(teacherIds)) {
      return res.status(400).json({ message: "teacherIds must be an array", status: false });
    }

    // Check for duplicate teacherIds
    const uniqueTeacherIds = [...new Set(teacherIds)];
    if (uniqueTeacherIds.length !== teacherIds.length) {
      return res.status(400).json({ message: "Duplicate teacher IDs are not allowed", status: false });
    }

    // Validate each teacher ID
    for (const teacherId of teacherIds) {
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        return res.status(400).json({ message: `Invalid teacher ID: ${teacherId}`, status: false });
      }
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({ message: `Teacher not found with ID: ${teacherId}`, status: false });
      }
    }

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found", status: false });
    }

    // Update the assignedTeachers array
    course.assignedTeachers = teacherIds;
    await course.save();

    // Fetch the updated course with populated teacher details
    const updatedCourse = await Course.findById(courseId)
      .populate("assignedTeachers", "name email")
      .populate("createdBy", "name email");

    res.status(200).json({
      data: updatedCourse,
      message: "Assigned teachers updated successfully",
      status: true,
    });
  } catch (error) {
    console.error(`Error in updateAssignedTeachers: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};