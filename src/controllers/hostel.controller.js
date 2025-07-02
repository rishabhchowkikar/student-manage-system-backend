import Hostel from "../models/Hostel.model.js";
import Course from "../models/course.model.js"
import StudentPersonalDetail from "../models/auth.model.js";
import BusPass from "../models/BusPass.model.js";
import mongoose from "mongoose";

// export const updateHostelDetails = async (req, res) => {
//   try {
//     const { userId, roomType, roomNumber, floor, hostelName, allocated } = req.body;

//     // Validate required fields
//     if (!userId || !roomType || !roomNumber || !floor || !hostelName || typeof allocated !== "boolean") {
//       return res.status(400).json({ message: "All fields (userId, roomType, roomNumber, floor, hostelName, allocated) are required", status: false });
//     }

//     // Validate userId format
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ message: "Invalid userId format", status: false });
//     }

//     // Ensure the userId corresponds to a student
//     const student = await StudentPersonalDetail.findById(userId);
//     if (!student) {
//       return res.status(404).json({ message: "Student not found", status: false });
//     }

//     const hostel = await Hostel.findOneAndUpdate(
//       { userId },
//       { roomType, roomNumber, floor, hostelName, allocated },
//       { new: true, upsert: true }
//     );

//     res.json({ data: hostel, status: true });
//   } catch (error) {
//     console.error(`Error in updateHostelDetails: ${error.message}`);
//     res.status(500).json({ message: "Server error", status: false });
//   }
// };
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
    const student = await StudentPersonalDetail.findById(userId).select("want_to_apply_for_hostel");
    if (!student) {
      return res.status(404).json({ message: "Student not found", status: false });
    }

    // Check if the student wants to apply for a hostel (first semester logic)
    if (!student.want_to_apply_for_hostel) {
      return res.status(400).json({
        message: "This student has indicated they do not want to apply for a hostel",
        status: false,
      });
    }

    // Proceed with hostel assignment
    const hostel = await Hostel.findOneAndUpdate(
      { userId },
      { roomType, roomNumber, floor, hostelName, allocated },
      { new: true, upsert: true }
    );

    res.json({
      data: hostel,
      status: true,
      message: "Hostel details updated successfully",
    });
  } catch (error) {
    console.error(`Error in updateHostelDetails: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};


// export const getHostelDetails = async (req, res) => {
//   try {
//     let hostelDetails;

//     if (req.user.role === "student") {
//       // For students, fetch only their own hostel details
//       hostelDetails = await Hostel.findOne({ userId: req.user._id })
//         .populate({
//           path: "userId",
//           select: "name email rollno courseId",
//           model: StudentPersonalDetail,
//           populate: {
//             path: "courseId",
//             select: "name department school code",
//             model: Course,
//           },
//         });

//       if (!hostelDetails) {
//         return res.status(404).json({ message: "Hostel details not found", status: false });
//       }
//       res.status(200).json({ data: hostelDetails, status: true });
//     } else if (req.user.role === "admin") {
//       // For admins, fetch all hostel details or a specific student's details
//       const { userId } = req.query; // Optional query parameter ?userId=

//       if (userId) {
//         // Validate userId format
//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//           return res.status(400).json({ message: "Invalid userId format", status: false });
//         }

//         // Fetch hostel details for the specific student
//         hostelDetails = await Hostel.findOne({ userId })
//           .populate({
//             path: "userId",
//             select: "name email rollno courseId",
//             model: StudentPersonalDetail,
//             populate: {
//               path: "courseId",
//               select: "name department school code",
//               model: Course,
//             },
//           });

//         if (!hostelDetails) {
//           return res.status(404).json({ message: "Hostel details not found for this student", status: false });
//         }

//         res.status(200).json({ data: hostelDetails, status: true });
//       } else {
//         // Fetch all hostel details for all students
//         hostelDetails = await Hostel.find({})
//           .populate({
//             path: "userId",
//             select: "name email rollno courseId",
//             model: StudentPersonalDetail,
//             populate: {
//               path: "courseId",
//               select: "name department school code",
//               model: Course,
//             },
//           });

//         // Filter out any hostel records where userId population failed (e.g., student not found)
//         hostelDetails = hostelDetails.filter(detail => detail.userId);

//         res.status(200).json({ data: hostelDetails, status: true });
//       }
//     } else {
//       return res.status(403).json({ message: "Access denied", status: false });
//     }
//   } catch (error) {
//     console.error(`Error in getHostelDetails: ${error.message}`);
//     console.error(error.stack);
//     res.status(500).json({ message: "Server error", status: false });
//   }
// };

export const getHostelDetails = async (req, res) => {
  try {
    let hostelDetails;

    if (req.user.role === "student") {
      // For students, fetch only their own hostel details with paymentStatus 'paid'
      hostelDetails = await Hostel.findOne({ 
        userId: req.user._id, 
        paymentStatus: 'paid' // Only show paid records for students
      })
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

export const applyForBusPass = async (req, res) => {
  try {
    const { distanceFromHomeInKms } = req.body;

    // Validate required field
    if (distanceFromHomeInKms === undefined || distanceFromHomeInKms === null) {
      return res.status(400).json({ message: "distanceFromHomeInKms is required", status: false });
    }

    // Validate distance
    if (typeof distanceFromHomeInKms !== "number" || distanceFromHomeInKms < 0) {
      return res.status(400).json({ message: "distanceFromHomeInKms must be a non-negative number", status: false });
    }

    // Fetch student details from logged-in user
    const student = await StudentPersonalDetail.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ message: "Student not found", status: false });
    }

    // Debug: Log student data to verify fields
    console.log("Student data:", student);

    // Fetch hostel details to check allocation
    const hostel = await Hostel.findOne({ userId: req.user._id });
    if (hostel && hostel.allocated) {
      return res.status(403).json({
        message: "Hostel allocated students cannot apply for a bus pass",
        status: false,
      });
    }

    // Check eligibility (distance < 60 km)
    if (distanceFromHomeInKms >= 60) {
      return res.status(400).json({
        message: "Students living 60 km or more from the university are not eligible for a bus pass",
        status: false,
      });
    }

    // Populate course details
    const populatedStudent = await StudentPersonalDetail.findById(req.user._id)
      .populate({
        path: "courseId",
        select: "name department school",
        model: Course,
      });

    // Calculate age from dob
    const dob = new Date(student.dob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    // Create bus pass application with corrected field mappings
    const busPass = new BusPass({
      studentId: req.user._id,
      fullName: student.name || "Unknown",
      mobileNumber: student.phone || "Unknown",
      department: populatedStudent.courseId ? populatedStudent.courseId.department : "Unknown",
      school: populatedStudent.courseId ? populatedStudent.courseId.school : "Unknown",
      course: populatedStudent.courseId ? populatedStudent.courseId.name : "Unknown",
      emailId: student.email || "Unknown",
      rollNo: student.rollno || "Unknown",
      age: age || 16, // Default to 16 if calculation fails
      fullAddress: student.address || "Unknown",
      distanceFromHomeInKms,
    });

    await busPass.save();

    res.status(201).json({
      data: busPass,
      message: "Bus pass application submitted successfully",
      status: true,
    });
  } catch (error) {
    console.error(`Error in applyForBusPass: ${error.message}`);
    console.error(error.stack);
    res.status(500).json({ message: "Server error", status: false });
  }
};


export const getBusPassApplications = async (req, res) => {
  try {
    const busPassApplications = await BusPass.find({})
      .populate({
        path: "studentId",
        select: "name email rollno address phone courseId", // Match schema fields
        model: StudentPersonalDetail,
        populate: {
          path: "courseId",
          select: "name department school", // Include department and school
          model: Course,
        },
      });

    const responseData = busPassApplications.map(application => ({
      studentId: application.studentId._id,
      fullName: application.studentId.name || "Unknown", // Use name instead of fullName
      emailId: application.studentId.email || "Unknown", // Use email instead of emailId
      rollNo: application.studentId.rollno || "Unknown", // Use rollno instead of rollNo
      courseName: application.studentId.courseId ? application.studentId.courseId.name : "N/A",
      department: application.studentId.courseId ? application.studentId.courseId.department : "Unknown",
      school: application.studentId.courseId ? application.studentId.courseId.school : "Unknown",
      distanceFromHomeInKms: application.distanceFromHomeInKms,
      status: application.status,
      createdAt: application.createdAt,
    }));

    res.status(200).json({
      data: responseData,
      status: true,
    });
  } catch (error) {
    console.error(`Error in getBusPassApplications: ${error.message}`);
    console.error(error.stack);
    res.status(500).json({ message: "Server error", status: false });
  }
};