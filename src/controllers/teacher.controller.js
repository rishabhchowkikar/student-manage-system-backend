import Teacher from "../models/Teacher.model.js";
import Subject from "../models/Subject.model.js";
import TimeTable from "../models/TimeTable.model.js";
import Course from "../models/Course.model.js";



// export const getProfile = async (req, res) => {
//   try {
//     // Use id from req.params.id (admin) or req.user._id (teacher)
//     const teacherId = req.params.id || req.user._id;

//     if (!teacherId) {
//       return res.status(400).json({ 
//         message: "Teacher ID is required", 
//         status: false 
//       });
//     }

//     // Fetch teacher basic details with populated course information
//     const teacher = await Teacher.findById(teacherId)
//       .populate({
//         path: "courseId",
//         select: "name code department school duration totalSemesters"
//       })
//       .select("-password");

//     if (!teacher) {
//       return res.status(404).json({ 
//         message: "Teacher not found", 
//         status: false 
//       });
//     }

//     // Fetch all subjects taught by this teacher with course details
//     const subjects = await Subject.find({ teacherId: teacherId })
//       .populate({
//         path: "courseId",
//         select: "name code department"
//       })
//       .select("name code semester courseId createdAt updatedAt")
//       .sort({ semester: 1, name: 1 });

//     // Group subjects by semester for better organization
//     const subjectsBySemester = subjects.reduce((acc, subject) => {
//       const semester = subject.semester || 'Unassigned';
//       if (!acc[semester]) {
//         acc[semester] = [];
//       }
//       acc[semester].push({
//         _id: subject._id,
//         name: subject.name,
//         code: subject.code,
//         course: subject.courseId,
//         createdAt: subject.createdAt,
//         updatedAt: subject.updatedAt
//       });
//       return acc;
//     }, {});

//     // Get teaching statistics
//     const teachingStats = {
//       totalSubjects: subjects.length,
//       semestersTeaching: Object.keys(subjectsBySemester).filter(sem => sem !== 'Unassigned').length,
//       coursesInvolved: [...new Set(subjects.map(s => s.courseId?._id?.toString()).filter(Boolean))].length
//     };

//     // Fetch timetables for semesters where teacher has subjects
//     const timetablePromises = Object.keys(subjectsBySemester).map(async (semester) => {
//       if (semester === 'Unassigned') return null;
      
//       const semesterSubjects = subjectsBySemester[semester];
//       const courseId = semesterSubjects[0]?.course?._id;
      
//       if (!courseId) return null;

//       const timetable = await TimeTable.findOne({
//         courseId: courseId,
//         semester: parseInt(semester)
//       }).populate({
//         path: "schedule.periods.subjectId",
//         select: "name code teacherId",
//         populate: {
//           path: "teacherId",
//           select: "name"
//         }
//       });

//       // Filter timetable to show only periods where this teacher is teaching
//       let teacherPeriods = [];
//       if (timetable && timetable.schedule) {
//         timetable.schedule.forEach(daySchedule => {
//           daySchedule.periods.forEach(period => {
//             if (period.subjectId?.teacherId?._id?.toString() === teacherId.toString()) {
//               teacherPeriods.push({
//                 day: daySchedule.day,
//                 time: period.time,
//                 subject: {
//                   name: period.subjectId.name,
//                   code: period.subjectId.code
//                 }
//               });
//             }
//           });
//         });
//       }

//       return {
//         semester: parseInt(semester),
//         courseName: semesterSubjects[0]?.course?.name,
//         courseCode: semesterSubjects[0]?.course?.code,
//         subjects: semesterSubjects,
//         timetablePeriods: teacherPeriods,
//         totalPeriods: teacherPeriods.length
//       };
//     });

//     const semesterDetails = (await Promise.all(timetablePromises))
//       .filter(Boolean)
//       .sort((a, b) => a.semester - b.semester);

//     // Prepare comprehensive profile response
//     const comprehensiveProfile = {
//       // Basic teacher information
//       basicInfo: {
//         _id: teacher._id,
//         name: teacher.name,
//         email: teacher.email,
//         department: teacher.department,
//         role: teacher.role,
//         phone: teacher.phone,
//         createdAt: teacher.createdAt,
//         updatedAt: teacher.updatedAt
//       },

//       // Course assignment
//       assignedCourse: teacher.courseId ? {
//         _id: teacher.courseId._id,
//         name: teacher.courseId.name,
//         code: teacher.courseId.code,
//         department: teacher.courseId.department,
//         school: teacher.courseId.school,
//         duration: teacher.courseId.duration,
//         totalSemesters: teacher.courseId.totalSemesters
//       } : null,

//       // Teaching statistics
//       teachingStats,

//       // Subjects organized by semester
//       subjectsBySemester,

//       // Detailed semester-wise information with timetables
//       semesterDetails,

//       // All subjects (flat list for quick reference)
//       allSubjects: subjects.map(subject => ({
//         _id: subject._id,
//         name: subject.name,
//         code: subject.code,
//         semester: subject.semester,
//         course: subject.courseId
//       })),

//       // System role (from JWT)
//       // systemRole: `T ${req.user.role}`,
      
//       // Indicates if this is admin viewing or teacher self-viewing
//       viewMode: req.params.id ? 'admin' : 'self'
//     };

//     res.status(200).json({
//       message: "Teacher profile fetched successfully",
//       status: true,
//       data: comprehensiveProfile
//     });

//   } catch (error) {
//     console.error(`Error in getProfile Teacher: ${error.message}`);
//     res.status(500).json({ 
//       message: "Server error while fetching teacher profile", 
//       status: false,
//       error: error.message 
//     });
//   }
// };

export const getProfile = async (req, res) => {
  try {
    // Use id from req.params.id (admin) or req.user._id (teacher)
    const teacherId = req.params.id || req.user._id;

    if (!teacherId) {
      return res.status(400).json({ 
        message: "Teacher ID is required", 
        status: false 
      });
    }

    // Fetch teacher basic details with populated course information
    const teacher = await Teacher.findById(teacherId)
      .populate({
        path: "courseId",
        select: "name code department school duration totalSemesters"
      })
      .select("-password");

    if (!teacher) {
      return res.status(404).json({ 
        message: "Teacher not found", 
        status: false 
      });
    }

    // Fetch all subjects taught by this teacher with course details
    const subjects = await Subject.find({ teacherId: teacherId })
      .populate({
        path: "courseId",
        select: "name code department school duration totalSemesters"
      })
      .select("name code semester courseId createdAt updatedAt")
      .sort({ semester: 1, name: 1 });

    // Group subjects by semester for better organization
    const subjectsBySemester = subjects.reduce((acc, subject) => {
      const semester = subject.semester || 'Unassigned';
      if (!acc[semester]) {
        acc[semester] = [];
      }
      acc[semester].push({
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        course: subject.courseId,
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt
      });
      return acc;
    }, {});

    // Get teaching statistics
    const teachingStats = {
      totalSubjects: subjects.length,
      semestersTeaching: Object.keys(subjectsBySemester).filter(sem => sem !== 'Unassigned').length,
      coursesInvolved: [...new Set(subjects.map(s => s.courseId?._id?.toString()).filter(Boolean))].length
    };

    // Fetch timetables for semesters where teacher has subjects
    const timetablePromises = Object.keys(subjectsBySemester).map(async (semester) => {
      if (semester === 'Unassigned') return null;
      
      const semesterSubjects = subjectsBySemester[semester];
      const courseId = semesterSubjects[0]?.course?._id;
      
      if (!courseId) return null;

      const timetable = await TimeTable.findOne({
        courseId: courseId,
        semester: parseInt(semester)
      }).populate({
        path: "schedule.periods.subjectId",
        select: "name code teacherId",
        populate: {
          path: "teacherId",
          select: "name"
        }
      });

      // Filter timetable to show only periods where this teacher is teaching
      let teacherPeriods = [];
      if (timetable && timetable.schedule) {
        timetable.schedule.forEach(daySchedule => {
          daySchedule.periods.forEach(period => {
            if (period.subjectId?.teacherId?._id?.toString() === teacherId.toString()) {
              teacherPeriods.push({
                day: daySchedule.day,
                time: period.time,
                subject: {
                  name: period.subjectId.name,
                  code: period.subjectId.code
                }
              });
            }
          });
        });
      }

      return {
        semester: parseInt(semester),
        courseName: semesterSubjects[0]?.course?.name,
        courseCode: semesterSubjects[0]?.course?.code,
        subjects: semesterSubjects,
        timetablePeriods: teacherPeriods,
        totalPeriods: teacherPeriods.length
      };
    });

    const semesterDetails = (await Promise.all(timetablePromises))
      .filter(Boolean)
      .sort((a, b) => a.semester - b.semester);

    // UPDATED LOGIC: First try to get course from teacher.courseId
    let assignedCourse = teacher.courseId ? {
      _id: teacher.courseId._id,
      name: teacher.courseId.name,
      code: teacher.courseId.code,
      department: teacher.courseId.department,
      school: teacher.courseId.school,
      duration: teacher.courseId.duration,
      totalSemesters: teacher.courseId.totalSemesters
    } : null;

    // If no direct courseId, derive from subjects taught
    if (!assignedCourse && subjects.length > 0) {
      const courseFromSubjects = subjects[0].courseId;
      if (courseFromSubjects) {
        assignedCourse = {
          _id: courseFromSubjects._id,
          name: courseFromSubjects.name,
          code: courseFromSubjects.code,
          department: courseFromSubjects.department,
          school: courseFromSubjects.school,
          duration: courseFromSubjects.duration,
          totalSemesters: courseFromSubjects.totalSemesters
        };
      }
    }

    // Prepare comprehensive profile response
    const comprehensiveProfile = {
      // Basic teacher information
      basicInfo: {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        role: teacher.role,
        phone: teacher.phone,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt
      },

      // Course assignment (now derived from subjects if not directly assigned)
      assignedCourse,

      // Teaching statistics
      teachingStats,

      // Subjects organized by semester
      subjectsBySemester,

      // Detailed semester-wise information with timetables
      semesterDetails,

      // All subjects (flat list for quick reference)
      allSubjects: subjects.map(subject => ({
        _id: subject._id,
        name: subject.name,
        code: subject.code,
        semester: subject.semester,
        course: subject.courseId
      })),

      // Indicates if this is admin viewing or teacher self-viewing
      viewMode: req.params.id ? 'admin' : 'self'
    };

    res.status(200).json({
      message: "Teacher profile fetched successfully",
      status: true,
      data: comprehensiveProfile
    });

  } catch (error) {
    console.error(`Error in getProfile Teacher: ${error.message}`);
    res.status(500).json({ 
      message: "Server error while fetching teacher profile", 
      status: false,
      error: error.message 
    });
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

export const assignCourseToTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        message: "Please provide a course ID",
        status: false
      });
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { courseId: courseId },
      { new: true, runValidators: true }
    ).populate({
      path: "courseId",
      select: "name code department school"
    }).select("-password");

    if (!updatedTeacher) {
      return res.status(404).json({
        message: "Teacher not found",
        status: false
      });
    }

    res.status(200).json({
      message: "Course assigned to teacher successfully",
      status: true,
      data: updatedTeacher
    });

  } catch (error) {
    console.error("Error in assignCourseToTeacher:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message
    });
  }
};

// export const getCourseTeachers = async (req, res) => {
//   try {
//     const { courseId } = req.params;

//     const teachers = await Teacher.find({ courseId })
//       .populate("courseId", "name code department")
//       .select("-password")
//       .sort({ role: 1, name: 1 }); // Sort by role hierarchy, then name

//     // Define role hierarchy for sorting
//     const roleHierarchy = {
//       "Head Of Department": 1,
//       "Professor": 2,
//       "Associate Professor": 3,
//       "Assistant Professor": 4
//     };

//     // Sort teachers by role hierarchy
//     const sortedTeachers = teachers.sort((a, b) => {
//       const aOrder = roleHierarchy[a.role] || 5;
//       const bOrder = roleHierarchy[b.role] || 5;
//       if (aOrder !== bOrder) {
//         return aOrder - bOrder;
//       }
//       return a.name.localeCompare(b.name);
//     });

//     res.status(200).json({
//       message: "Course teachers fetched successfully",
//       status: true,
//       data: sortedTeachers,
//       count: sortedTeachers.length
//     });

//   } catch (error) {
//     console.error("Error in getCourseTeachers:", error.message);
//     res.status(500).json({
//       message: "Internal Server Error",
//       status: false,
//       error: error.message
//     });
//   }
// };


export const getCourseTeachers = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Fetch course and populate assigned teachers
    const course = await Course.findById(courseId)
      .populate({
        path: "assignedTeachers",
        select: "-password",
        populate: {
          path: "courseId",
          select: "name code department"
        }
      });

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
        status: false
      });
    }

    const teachers = course.assignedTeachers;

    // Apply the same sorting logic
    const roleHierarchy = {
      "Head Of Department": 1,
      "Professor": 2,
      "Associate Professor": 3,
      "Assistant Professor": 4
    };

    const sortedTeachers = teachers.sort((a, b) => {
      const aOrder = roleHierarchy[a.role] || 5;
      const bOrder = roleHierarchy[b.role] || 5;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      return a.name.localeCompare(b.name);
    });

    res.status(200).json({
      message: "Course teachers fetched successfully",
      status: true,
      data: sortedTeachers,
      count: sortedTeachers.length
    });

  } catch (error) {
    console.error("Error in getCourseTeachers:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message
    });
  }
};



export const removeTeacherFromCourse = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { $unset: { courseId: 1 } }, // Remove courseId field
      { new: true }
    ).select("-password");

    if (!updatedTeacher) {
      return res.status(404).json({
        message: "Teacher not found",
        status: false
      });
    }

    res.status(200).json({
      message: "Teacher removed from course successfully",
      status: true,
      data: updatedTeacher
    });

  } catch (error) {
    console.error("Error in removeTeacherFromCourse:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message
    });
  }
};