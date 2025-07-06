import Hostel from "../models/Hostel.model.js";
import Course from "../models/course.model.js";
import StudentPersonalDetail from "../models/auth.model.js";
import BusPass from "../models/BusPass.model.js";
import mongoose from "mongoose";

// Helper function to get current academic year
function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Academic year typically starts in July/August
  if (month >= 7) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

// Update hostel details (Admin only)
export const updateHostelDetails = async (req, res) => {
  try {
    const { userId, roomType, roomNumber, floor, hostelName, allocated, academicYear } = req.body;

    // Validate required fields
    if (!userId || !roomType || !roomNumber || !floor || !hostelName || typeof allocated !== "boolean") {
      return res.status(400).json({ 
        message: "All fields (userId, roomType, roomNumber, floor, hostelName, allocated) are required", 
        status: false 
      });
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

    // Check if the student wants to apply for a hostel
    if (!student.want_to_apply_for_hostel) {
      return res.status(400).json({
        message: "This student has indicated they do not want to apply for a hostel",
        status: false,
      });
    }

    // Use provided academic year or current one
    const currentAcademicYear = academicYear || getCurrentAcademicYear();

    // Proceed with hostel assignment for specific academic year
    const hostel = await Hostel.findOneAndUpdate(
      { userId, academicYear: currentAcademicYear },
      { 
        roomType, 
        roomNumber, 
        floor, 
        hostelName, 
        allocated,
        academicYear: currentAcademicYear,
        updatedAt: new Date()
      },
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

// Get current hostel details (Student/Admin)
export const getHostelDetails = async (req, res) => {
  try {
    let hostelDetails;

    if (req.user.role === "student") {
      // Get current academic year hostel details for student
      const currentYear = getCurrentAcademicYear();
      
      hostelDetails = await Hostel.findOne({ 
        userId: req.user._id, 
        paymentStatus: 'paid',
        academicYear: currentYear
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
        return res.status(404).json({ 
          message: "Hostel details not found for current academic year", 
          status: false 
        });
      }
      
      res.status(200).json({ data: hostelDetails, status: true });
      
    } else if (req.user.role === "admin") {
      // Admin logic remains the same
      const { userId, academicYear } = req.query;

      if (userId) {
        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ message: "Invalid userId format", status: false });
        }

        // Build query
        const query = { userId };
        if (academicYear) {
          query.academicYear = academicYear;
        }

        // Fetch hostel details for the specific student
        hostelDetails = await Hostel.find(query)
          .populate({
            path: "userId",
            select: "name email rollno courseId",
            model: StudentPersonalDetail,
            populate: {
              path: "courseId",
              select: "name department school code",
              model: Course,
            },
          })
          .sort({ academicYear: -1 });

        if (!hostelDetails || hostelDetails.length === 0) {
          return res.status(404).json({ 
            message: "Hostel details not found for this student", 
            status: false 
          });
        }

        res.status(200).json({ data: hostelDetails, status: true });
      } else {
        // Fetch all hostel details for all students
        const query = {};
        if (academicYear) {
          query.academicYear = academicYear;
        }

        hostelDetails = await Hostel.find(query)
          .populate({
            path: "userId",
            select: "name email rollno courseId",
            model: StudentPersonalDetail,
            populate: {
              path: "courseId",
              select: "name department school code",
              model: Course,
            },
          })
          .sort({ academicYear: -1, createdAt: -1 });

        // Filter out any hostel records where userId population failed
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

// Get hostel payment history (Student only)
export const getHostelPaymentHistory = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied", status: false });
    }

    // Get all paid hostel records for the student, sorted by academic year (latest first)
    const paymentHistory = await Hostel.find({ 
      userId: req.user._id,
      paymentStatus: 'paid'
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
    })
    .sort({ academicYear: -1, createdAt: -1 });

    if (!paymentHistory || paymentHistory.length === 0) {
      return res.status(404).json({ 
        message: "No payment history found", 
        status: false 
      });
    }

    res.status(200).json({ 
      data: paymentHistory, 
      status: true,
      message: "Payment history retrieved successfully"
    });
  } catch (error) {
    console.error(`Error in getHostelPaymentHistory: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Get hostel payment details by academic year (Student only)
export const getHostelPaymentByYear = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied", status: false });
    }

    const { academicYear } = req.params;

    if (!academicYear) {
      return res.status(400).json({ 
        message: "Academic year is required", 
        status: false 
      });
    }

    const paymentDetails = await Hostel.findOne({ 
      userId: req.user._id,
      academicYear: academicYear,
      paymentStatus: 'paid'
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

    if (!paymentDetails) {
      return res.status(404).json({ 
        message: `No payment found for academic year ${academicYear}`, 
        status: false 
      });
    }

    res.status(200).json({ 
      data: paymentDetails, 
      status: true 
    });
  } catch (error) {
    console.error(`Error in getHostelPaymentByYear: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Get available academic years for a student (Student only)
export const getAvailableAcademicYears = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Access denied", status: false });
    }

    const academicYears = await Hostel.distinct('academicYear', { 
      userId: req.user._id,
      paymentStatus: 'paid'
    });

    res.status(200).json({ 
      data: academicYears.sort().reverse(), // Latest year first
      status: true 
    });
  } catch (error) {
    console.error(`Error in getAvailableAcademicYears: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Update payment status (Admin only)
export const updatePaymentStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied", status: false });
    }

    const { hostelId } = req.params;
    const { paymentStatus, razorpayPaymentId, paymentDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(hostelId)) {
      return res.status(400).json({ message: "Invalid hostel ID format", status: false });
    }

    const updateData = { 
      paymentStatus,
      updatedAt: new Date()
    };

    if (razorpayPaymentId) {
      updateData.razorpayPaymentId = razorpayPaymentId;
    }

    if (paymentDate) {
      updateData.paymentDate = new Date(paymentDate);
    }

    const updatedHostel = await Hostel.findByIdAndUpdate(
      hostelId,
      updateData,
      { new: true }
    ).populate({
      path: "userId",
      select: "name email rollno courseId",
      model: StudentPersonalDetail,
      populate: {
        path: "courseId",
        select: "name department school code",
        model: Course,
      },
    });

    if (!updatedHostel) {
      return res.status(404).json({ message: "Hostel record not found", status: false });
    }

    res.status(200).json({ 
      data: updatedHostel, 
      status: true,
      message: "Payment status updated successfully"
    });
  } catch (error) {
    console.error(`Error in updatePaymentStatus: ${error.message}`);
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

export const getStudentBusPass = async (req, res) => {
  try {
    // Always fetch the student details
    const student = await StudentPersonalDetail.findById(req.user._id)
      .populate({
        path: "courseId",
        select: "name department school",
        model: Course,
      });

    // Always fetch hostel allocation for this user
    const hostel = await Hostel.findOne({ userId: req.user._id });

    // If student not found, return a clear message (but still include hostel info as false)
    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        status: false,
        data: {
          want_to_apply_for_hostel: false,
          hostel_allocated: hostel ? hostel.allocated : false,
        },
      });
    }

    // Try to find the bus pass
    const busPass = await BusPass.findOne({ studentId: req.user._id })
      .populate({
        path: "studentId",
        select: "name email rollno address phone courseId dob want_to_apply_for_hostel",
        model: StudentPersonalDetail,
        populate: {
          path: "courseId",
          select: "name department school",
          model: Course,
        },
      });

    // If no bus pass, return student and hostel info
    if (!busPass) {
      return res.status(404).json({
        message: "No bus pass found for this student",
        status: false,
        data: {
          want_to_apply_for_hostel: student.want_to_apply_for_hostel ?? false,
          hostel_allocated: hostel ? hostel.allocated : false,
        },
      });
    }

    // Calculate age from dob
    let age = "Unknown";
    if (busPass.studentId.dob) {
      const dob = new Date(busPass.studentId.dob);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    // Prepare response data (all required fields)
    const responseData = {
      studentId: busPass.studentId._id,
      fullName: busPass.studentId.name || "Unknown",
      emailId: busPass.studentId.email || "Unknown",
      rollNo: busPass.studentId.rollno || "Unknown",
      phone: busPass.studentId.phone || "Unknown",
      course: busPass.studentId.courseId ? busPass.studentId.courseId.name : "N/A",
      department: busPass.studentId.courseId ? busPass.studentId.courseId.department : "Unknown",
      school: busPass.studentId.courseId ? busPass.studentId.courseId.school : "Unknown",
      age,
      fullAddress: busPass.studentId.address || "Unknown",
      distanceFromHomeInKms: busPass.distanceFromHomeInKms,
      status: busPass.status,
      createdAt: busPass.createdAt,
      want_to_apply_for_hostel: busPass.studentId.want_to_apply_for_hostel ?? false,
      hostel_allocated: hostel ? hostel.allocated : false
    };

    res.status(200).json({
      data: responseData,
      status: true,
    });
  } catch (error) {
    console.error(`Error in getStudentBusPass: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};