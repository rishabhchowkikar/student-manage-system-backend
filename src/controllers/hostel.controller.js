import Hostel from "../models/Hostel.model.js";
import Course from "../models/course.model.js"
import StudentPersonalDetail from "../models/auth.model.js";
import mongoose from "mongoose";

export const updateHostelDetails = async (req, res) => {
  try {
    const { userId, roomType, roomNumber, floor, hostelName, allocated } = req.body;

    // Validate required fields
    if (!userId || !roomType || !roomNumber || !floor || !hostelName || typeof allocated !== "boolean") {
      return res.status(400).json({ message: "All fields (userId, roomType, roomNumber, floor, hostelName, allocated) are required", status: false });
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format", status: false });
    }

    // Ensure the userId corresponds to a student
    const student = await StudentPersonalDetail.findById(userId);
    if (!student) {
      return res.status(404).json({ message: "Student not found", status: false });
    }

    const hostel = await Hostel.findOneAndUpdate(
      { userId },
      { roomType, roomNumber, floor, hostelName, allocated },
      { new: true, upsert: true }
    );

    res.json({ data: hostel, status: true });
  } catch (error) {
    console.error(`Error in updateHostelDetails: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const getHostelDetails = async (req, res) => {
  try {
    let hostelDetails;

    if (req.user.role === "student") {
      // For students, fetch only their own hostel details
      hostelDetails = await Hostel.findOne({ userId: req.user._id })
        .populate({
          path: "userId",
          select: "name email rollno courseId",
          model: StudentPersonalDetail,
          populate: {
            path: "courseId",
            select: "name department school code",
            model: Course,
          },
        });

      if (!hostelDetails) {
        return res.status(404).json({ message: "Hostel details not found", status: false });
      }
      res.status(200).json({ data: hostelDetails, status: true });
    } else if (req.user.role === "admin") {
      // For admins, fetch all hostel details or a specific student's details
      const { userId } = req.query; // Optional query parameter ?userId=

      if (userId) {
        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ message: "Invalid userId format", status: false });
        }

        // Fetch hostel details for the specific student
        hostelDetails = await Hostel.findOne({ userId })
          .populate({
            path: "userId",
            select: "name email rollno courseId",
            model: StudentPersonalDetail,
            populate: {
              path: "courseId",
              select: "name department school code",
              model: Course,
            },
          });

        if (!hostelDetails) {
          return res.status(404).json({ message: "Hostel details not found for this student", status: false });
        }

        res.status(200).json({ data: hostelDetails, status: true });
      } else {
        // Fetch all hostel details for all students
        hostelDetails = await Hostel.find({})
          .populate({
            path: "userId",
            select: "name email rollno courseId",
            model: StudentPersonalDetail,
            populate: {
              path: "courseId",
              select: "name department school code",
              model: Course,
            },
          });

        // Filter out any hostel records where userId population failed (e.g., student not found)
        hostelDetails = hostelDetails.filter(detail => detail.userId);

        res.status(200).json({ data: hostelDetails, status: true });
      }
    } else {
      return res.status(403).json({ message: "Access denied", status: false });
    }
  } catch (error) {
    console.error(`Error in getHostelDetails: ${error.message}`);
    console.error(error.stack);
    res.status(500).json({ message: "Server error", status: false });
  }
};