// controllers/courseFees.controller.js
import CourseFees from "../models/CourseFees.model.js";
import FeeStructure from "../models/FeeStructure.model.js";
import Auth from "../models/Auth.model.js";
import crypto from "crypto";
import razorpay from "../utils/razorpay.js";


// Helper function to get current academic year
function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  if (month >= 7) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

// Get fee structure for a course
export const getFeeStructure = async (req, res) => {
  try {
    const { courseId, academicYear } = req.query;
    const currentYear = academicYear || getCurrentAcademicYear();

    // Get student details to find their courseId
    const student = await Auth.findById(req.user._id)
      .populate('courseId');

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        status: false,
      });
    }

    // Use courseId from query or student's courseId
    const targetCourseId = courseId || student.courseId._id;

    console.log("Looking for fee structure with:");
    console.log("courseId:", targetCourseId);
    console.log("academicYear:", currentYear);

    const feeStructure = await FeeStructure.findOne({
      courseId: targetCourseId,
      academicYear: currentYear,
      isActive: true,
    }).populate('courseId', 'name code department school');

    if (!feeStructure) {
      return res.status(404).json({
        message: "Fee structure not found for this course and academic year",
        status: false,
        debug: {
          searchedCourseId: targetCourseId,
          searchedAcademicYear: currentYear,
          studentCourseId: student.courseId._id
        }
      });
    }

    res.status(200).json({
      data: feeStructure,
      status: true,
    });
  } catch (error) {
    console.error(`Error in getFeeStructure: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Get student's fee status
export const getStudentFeeStatus = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { academicYear } = req.query;

    // Get student details
    const student = await Auth.findById(studentId)
      .populate('courseId', 'name code department school');

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        status: false,
      });
    }

    // Build query
    const query = { studentId };
    if (academicYear) {
      query.academicYear = academicYear;
    }

    // Get all fee records for the student
    const feeRecords = await CourseFees.find(query)
      .populate('courseId', 'name code')
      .sort({ academicYear: -1, createdAt: -1 });

    // Group by academic year
    const feesByYear = {};
    feeRecords.forEach(fee => {
      if (!feesByYear[fee.academicYear]) {
        feesByYear[fee.academicYear] = [];
      }
      feesByYear[fee.academicYear].push(fee);
    });

    res.status(200).json({
      data: {
        student: {
          name: student.name,
          rollno: student.rollno,
          email: student.email,
          course: student.courseId,
        },
        feesByYear,
        totalRecords: feeRecords.length,
      },
      status: true,
    });
  } catch (error) {
    console.error(`Error in getStudentFeeStatus: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Create payment order for course fees
export const createCourseFeesOrder = async (req, res) => {
  try {
    const { feeType, amount, academicYear, semester, description } = req.body;
    const studentId = req.user._id;

    // Validate required fields
    if (!feeType || !amount || !academicYear || !description) {
      return res.status(400).json({
        message: "Fee type, amount, academic year, and description are required",
        status: false,
      });
    }

    // Get student details
    const student = await Auth.findById(studentId)
      .populate('courseId');

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        status: false,
      });
    }

    // Check if fee already exists and is paid
    const existingFee = await CourseFees.findOne({
      studentId,
      feeType,
      academicYear,
      semester: semester || undefined,
      paymentStatus: { $in: ['paid', 'pending'] }
    });

    if (existingFee && existingFee.paymentStatus === 'paid') {
      return res.status(400).json({
        message: "Fee for this period is already paid",
        status: false,
      });
    }

    // Calculate final amount (including late fee if applicable)
    let finalAmount = amount;
    let lateFee = 0;

    // Add late fee logic if needed
    const currentDate = new Date();
    const dueDate = new Date(academicYear.split('-')[0], 6, 31); // July 31st
    if (currentDate > dueDate && feeType !== 'admission') {
      lateFee = Math.min(amount * 0.1, 5000); // 10% late fee, max 5000
      finalAmount += lateFee;
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: finalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `CF_${studentId.toString().slice(-8)}_${Date.now()}`,
      notes: {
        studentId: studentId.toString(),
        feeType,
        academicYear,
        semester: semester?.toString() || '',
        purpose: 'course_fees'
      }
    });

    // Create or update fee record
    let feeRecord;
    if (existingFee && existingFee.paymentStatus === 'pending') {
      // Update existing pending record
      feeRecord = await CourseFees.findByIdAndUpdate(
        existingFee._id,
        {
          amount,
          finalAmount,
          lateFee,
          razorpayOrderId: razorpayOrder.id,
          description,
          dueDate,
        },
        { new: true }
      );
    } else {
      // Create new fee record
      feeRecord = new CourseFees({
        studentId,
        courseId: student.courseId._id,
        feeType,
        academicYear,
        semester,
        amount,
        finalAmount,
        lateFee,
        dueDate,
        description,
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: 'pending',
      });
      await feeRecord.save();
    }

    res.status(200).json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      feeRecordId: feeRecord._id,
      status: true,
      message: "Payment order created successfully",
    });
  } catch (error) {
    console.error(`Error in createCourseFeesOrder: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Verify course fees payment
export const verifyCourseFeesPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      feeRecordId,
    } = req.body;

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        message: "Invalid payment signature",
        status: false,
      });
    }

    // Update fee record
    const feeRecord = await CourseFees.findByIdAndUpdate(
      feeRecordId,
      {
        paymentStatus: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        paidDate: new Date(),
        transactionId: razorpay_payment_id,
        paymentMethod: 'online',
      },
      { new: true }
    ).populate('studentId', 'name rollno email')
     .populate('courseId', 'name code');

    if (!feeRecord) {
      return res.status(404).json({
        message: "Fee record not found",
        status: false,
      });
    }

    res.status(200).json({
      data: feeRecord,
      message: "Payment verified successfully",
      status: true,
    });
  } catch (error) {
    console.error(`Error in verifyCourseFeesPayment: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Get pending fees for a student
export const getPendingFees = async (req, res) => {
  try {
    const studentId = req.user._id;

    const pendingFees = await CourseFees.find({
      studentId,
      paymentStatus: { $in: ['pending', 'overdue'] }
    })
    .populate('courseId', 'name code')
    .sort({ dueDate: 1 });

    res.status(200).json({
      data: pendingFees,
      status: true,
    });
  } catch (error) {
    console.error(`Error in getPendingFees: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Get fee payment history
export const getFeePaymentHistory = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { academicYear, feeType } = req.query;

    const query = { 
      studentId,
      paymentStatus: 'paid'
    };

    if (academicYear) query.academicYear = academicYear;
    if (feeType) query.feeType = feeType;

    const paymentHistory = await CourseFees.find(query)
      .populate('courseId', 'name code')
      .sort({ paidDate: -1 });

    res.status(200).json({
      data: paymentHistory,
      status: true,
    });
  } catch (error) {
    console.error(`Error in getFeePaymentHistory: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Admin: Get all fee records
export const getAllFeeRecords = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Access denied",
        status: false,
      });
    }

    const { 
      page = 1, 
      limit = 20, 
      academicYear, 
      feeType, 
      paymentStatus,
      courseId 
    } = req.query;

    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (feeType) query.feeType = feeType;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (courseId) query.courseId = courseId;

    const feeRecords = await CourseFees.find(query)
      .populate('studentId', 'name rollno email')
      .populate('courseId', 'name code department')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CourseFees.countDocuments(query);

    res.status(200).json({
      data: feeRecords,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
      status: true,
    });
  } catch (error) {
    console.error(`Error in getAllFeeRecords: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};


export const createFeeStructure = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Access denied",
        status: false,
      });
    }

    const {
      courseId,
      academicYear,
      feeBreakdown,
      totalYearlyFee,
      paymentSchedule = "yearly"
    } = req.body;

    // Validate required fields
    if (!courseId || !academicYear || !feeBreakdown || !totalYearlyFee) {
      return res.status(400).json({
        message: "Course ID, academic year, fee breakdown, and total yearly fee are required",
        status: false,
      });
    }

    // Check if fee structure already exists
    const existingStructure = await FeeStructure.findOne({
      courseId,
      academicYear,
    });

    if (existingStructure) {
      return res.status(400).json({
        message: "Fee structure already exists for this course and academic year",
        status: false,
      });
    }

    // Create fee structure
    const feeStructure = new FeeStructure({
      courseId,
      academicYear,
      feeBreakdown,
      totalYearlyFee,
      paymentSchedule,
      isActive: true,
    });

    await feeStructure.save();

    const populatedStructure = await FeeStructure.findById(feeStructure._id)
      .populate('courseId', 'name code department school');

    res.status(201).json({
      data: populatedStructure,
      message: "Fee structure created successfully",
      status: true,
    });
  } catch (error) {
    console.error(`Error in createFeeStructure: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Admin: Update Fee Structure
export const updateFeeStructure = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Access denied",
        status: false,
      });
    }

    const { structureId } = req.params;
    const {
      feeBreakdown,
      totalYearlyFee,
      paymentSchedule,
      isActive
    } = req.body;

    // Find existing structure
    const existingStructure = await FeeStructure.findById(structureId);
    if (!existingStructure) {
      return res.status(404).json({
        message: "Fee structure not found",
        status: false,
      });
    }

    // Update fields
    if (feeBreakdown) existingStructure.feeBreakdown = feeBreakdown;
    if (totalYearlyFee) existingStructure.totalYearlyFee = totalYearlyFee;
    if (paymentSchedule) existingStructure.paymentSchedule = paymentSchedule;
    if (typeof isActive === 'boolean') existingStructure.isActive = isActive;
    
    existingStructure.updatedAt = new Date();

    await existingStructure.save();

    const populatedStructure = await FeeStructure.findById(structureId)
      .populate('courseId', 'name code department school');

    res.status(200).json({
      data: populatedStructure,
      message: "Fee structure updated successfully",
      status: true,
    });
  } catch (error) {
    console.error(`Error in updateFeeStructure: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Admin: Get All Fee Structures
export const getAllFeeStructures = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Access denied",
        status: false,
      });
    }

    const { academicYear, courseId, isActive } = req.query;
    
    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (courseId) query.courseId = courseId;
    if (typeof isActive === 'string') query.isActive = isActive === 'true';

    const feeStructures = await FeeStructure.find(query)
      .populate('courseId', 'name code department school')
      .sort({ academicYear: -1, createdAt: -1 });

    res.status(200).json({
      data: feeStructures,
      status: true,
    });
  } catch (error) {
    console.error(`Error in getAllFeeStructures: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Generate year-wise fee records for a student's course duration
export const generateYearwiseFeeRecords = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get student details
    const student = await Auth.findById(studentId)
      .populate('courseId');

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        status: false,
      });
    }

    // Get course duration (assuming 4 years for B.Tech)
    const courseDuration = 4; // You can make this dynamic based on course
    const currentYear = new Date().getFullYear();
    
    // Generate academic years for the course duration
    const academicYears = [];
    for (let i = 0; i < courseDuration; i++) {
      academicYears.push(`${currentYear + i}-${currentYear + i + 1}`);
    }

    // Get fee structure for the course
    const feeStructures = await FeeStructure.find({
      courseId: student.courseId._id,
      academicYear: { $in: academicYears },
      isActive: true
    });

    // Generate fee records for each year
    const yearwiseFees = {};
    
    for (const year of academicYears) {
      const feeStructure = feeStructures.find(fs => fs.academicYear === year);
      
      if (feeStructure) {
        // Check if student has already paid for this year
        const existingPayment = await CourseFees.findOne({
          studentId,
          academicYear: year,
          paymentStatus: 'paid'
        });

        // Check if there's a pending payment
        const pendingPayment = await CourseFees.findOne({
          studentId,
          academicYear: year,
          paymentStatus: 'pending'
        });

        yearwiseFees[year] = {
          academicYear: year,
          totalFee: feeStructure.totalYearlyFee,
          feeBreakdown: feeStructure.feeBreakdown,
          paymentStatus: existingPayment ? 'paid' : (pendingPayment ? 'pending' : 'not_paid'),
          paidAmount: existingPayment ? existingPayment.finalAmount : 0,
          pendingAmount: existingPayment ? 0 : feeStructure.totalYearlyFee,
          canPay: !existingPayment && year <= `${currentYear}-${currentYear + 1}`, // Can only pay current or past years
          paymentRecord: existingPayment || pendingPayment || null
        };
      }
    }

    res.status(200).json({
      data: {
        student: {
          name: student.name,
          rollno: student.rollno,
          email: student.email,
          course: student.courseId
        },
        yearwiseFees,
        courseDuration
      },
      status: true
    });
  } catch (error) {
    console.error(`Error in generateYearwiseFeeRecords: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};
