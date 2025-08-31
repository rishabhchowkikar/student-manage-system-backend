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

export const getCourseTeachers = async (req, res) => {
  try {
    const { courseId } = req.params;

    const teachers = await Teacher.find({ courseId })
      .populate("courseId", "name code department")
      .select("-password")
      .sort({ role: 1, name: 1 }); // Sort by role hierarchy, then name

    // Define role hierarchy for sorting
    const roleHierarchy = {
      "Head Of Department": 1,
      "Professor": 2,
      "Associate Professor": 3,
      "Assistant Professor": 4
    };

    // Sort teachers by role hierarchy
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