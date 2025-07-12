// controllers/courseFee.controller.js
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

// Helper function to generate student's academic years based on enrollment
function generateStudentAcademicYears(enrollmentYear, courseDuration) {
  const academicYears = [];
  for (let i = 0; i < courseDuration; i++) {
    const yearStart = enrollmentYear + i;
    academicYears.push(`${yearStart}-${yearStart + 1}`);
  }
  return academicYears;
}



// Helper function to determine which year student can pay
function getPayableYear(studentAcademicYears) {
  const currentAcademicYear = getCurrentAcademicYear();
  
  // Find the current year in student's academic timeline
  for (const year of studentAcademicYears) {
    if (year === currentAcademicYear) {
      return year;
    }
  }
  
  // If current academic year is not in student's timeline,
  // check if they're in a future year (graduated) or past year (not yet enrolled)
  const currentYearStart = parseInt(currentAcademicYear.split('-')[0]);
  const studentFirstYear = parseInt(studentAcademicYears[0].split('-')[0]);
  
  if (currentYearStart < studentFirstYear) {
    return null; // Student hasn't started yet
  } else {
    return null; // Student has graduated
  }
}

// Generate receipt number
const generateReceiptNumber = (studentId, academicYear, isTemporary = false) => {
  const timestamp = Date.now();
  const studentIdShort = studentId.toString().slice(-6);
  const yearShort = academicYear.split('-')[0].slice(-2);
  const prefix = isTemporary ? 'TMP' : 'RCP';
  
  return `${prefix}FEE${yearShort}${studentIdShort}${timestamp}`;
};

// Get student's complete fee structure
export const getStudentFeeStructure = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get student details with course and enrollment info
    const student = await Auth.findById(studentId)
      .populate('courseId', 'name code department school duration');

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        status: false,
      });
    }

    // Get student's enrollment year
    const enrollmentDate = student.admissionDate || student.createdAt;
    const enrollmentYear = enrollmentDate.getFullYear();
    
    // Adjust enrollment year based on admission month
    const enrollmentMonth = enrollmentDate.getMonth() + 1;
    const actualEnrollmentYear = enrollmentMonth >= 7 ? enrollmentYear : enrollmentYear - 1;

    // Get course duration
    const courseDuration = student.courseId.duration || 4;

    // Generate student's academic years
    const studentAcademicYears = generateStudentAcademicYears(actualEnrollmentYear, courseDuration);

    // Get current payable year
    const payableYear = getPayableYear(studentAcademicYears);

    // Get current fee structure for the course
    const feeStructure = await FeeStructure.getCurrentFeeStructure(student.courseId._id);

    if (!feeStructure) {
      return res.status(404).json({
        message: "Fee structure not found for this course",
        status: false,
      });
    }

    // Build year-wise fee data
    const yearwiseFees = {};
    
    for (const academicYear of studentAcademicYears) {
      // Check existing payment record
      const existingPayment = await CourseFees.findOne({
        studentId,
        academicYear,
        paymentStatus: 'paid'
      });

      // Check pending payment
      const pendingPayment = await CourseFees.findOne({
        studentId,
        academicYear,
        paymentStatus: 'pending'
      });

      // Get due date using the fee structure method
      const dueDate = feeStructure.getDueDate(academicYear);

      // Calculate penalty using the fee structure method
      const penalty = feeStructure.calculatePenalty(dueDate, feeStructure.totalYearlyFee);
      const totalAmount = feeStructure.totalYearlyFee + penalty;

      // Determine payment status and availability
      let paymentStatus = 'not_paid';
      let canPay = false;
      
      if (existingPayment) {
        paymentStatus = 'paid';
      } else if (pendingPayment) {
        paymentStatus = 'pending';
      } else if (academicYear === payableYear) {
        canPay = true;
        if (new Date() > dueDate) {
          paymentStatus = 'overdue';
        }
      } else if (new Date() > dueDate && !existingPayment) {
        paymentStatus = 'overdue';
      }

      yearwiseFees[academicYear] = {
        academicYear,
        yearNumber: studentAcademicYears.indexOf(academicYear) + 1,
        totalFee: feeStructure.totalYearlyFee,
        penalty,
        totalAmount,
        feeBreakdown: feeStructure.feeBreakdown,
        paymentStatus,
        paidAmount: existingPayment ? existingPayment.finalAmount : 0,
        pendingAmount: existingPayment ? 0 : totalAmount,
        dueDate: dueDate.toISOString(),
        canPay,
        isCurrentYear: academicYear === payableYear,
        paymentRecord: existingPayment || pendingPayment || null
      };
    }

    res.status(200).json({
      data: {
        student: {
          name: student.name,
          rollno: student.rollno,
          email: student.email,
          course: student.courseId,
          enrollmentYear: actualEnrollmentYear,
          batchYear: `${actualEnrollmentYear}-${actualEnrollmentYear + courseDuration}`
        },
        yearwiseFees,
        courseDuration,
        currentAcademicYear: getCurrentAcademicYear(),
        payableYear,
        feeStructureInfo: {
          version: feeStructure.version,
          effectiveFrom: feeStructure.effectiveFrom,
          penaltyConfig: feeStructure.penaltyConfig
        }
      },
      status: true
    });
  } catch (error) {
    console.error(`Error in getStudentFeeStructure: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Create payment order
export const createFeePaymentOrder = async (req, res) => {
  try {
    const { academicYear } = req.body;
    const studentId = req.user._id;

    if (!academicYear) {
      return res.status(400).json({
        message: "Academic year is required",
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

    // Enhanced payment eligibility logic
    const enrollmentDate = student.admissionDate || student.createdAt;
    const enrollmentYear = enrollmentDate.getFullYear();
    const enrollmentMonth = enrollmentDate.getMonth() + 1;
    const actualEnrollmentYear = enrollmentMonth >= 7 ? enrollmentYear : enrollmentYear - 1;
    
    const courseDuration = student.courseId.duration || 4;
    const studentAcademicYears = generateStudentAcademicYears(actualEnrollmentYear, courseDuration);
    const currentAcademicYear = getCurrentAcademicYear();
    
    // Check if the requested year is valid for this student
    if (!studentAcademicYears.includes(academicYear)) {
      return res.status(400).json({
        message: "Invalid academic year for your course duration",
        status: false,
      });
    }

    // Enhanced payment validation - allow current year OR overdue years
    const isCurrentYear = academicYear === currentAcademicYear;
    const isOverdueYear = isYearOverdue(academicYear, currentAcademicYear);
    const isValidPaymentYear = isCurrentYear || isOverdueYear;

    if (!isValidPaymentYear) {
      return res.status(400).json({
        message: "Payment is only allowed for current academic year or overdue years",
        status: false,
      });
    }

    // Check if already paid
    const existingPayment = await CourseFees.findOne({
      studentId,
      academicYear,
      paymentStatus: 'paid'
    });

    if (existingPayment) {
      return res.status(400).json({
        message: "Fee for this academic year is already paid",
        status: false,
      });
    }

    // Get fee structure
    const feeStructure = await FeeStructure.getCurrentFeeStructure(student.courseId._id);

    if (!feeStructure) {
      return res.status(404).json({
        message: "Fee structure not found",
        status: false,
      });
    }

    // Calculate total amount with penalty for overdue payments
    const yearStart = parseInt(academicYear.split('-')[0]);
    const dueDate = new Date(yearStart, 6, 31); // July 31st
    const penalty = isOverdueYear ? feeStructure.calculatePenalty(dueDate, feeStructure.totalYearlyFee) : 0;
    const finalAmount = feeStructure.totalYearlyFee + penalty;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: finalAmount * 100,
      currency: 'INR',
      receipt: `CF_${studentId.toString().slice(-8)}_${Date.now()}`,
      notes: {
        studentId: studentId.toString(),
        academicYear,
        courseId: student.courseId._id.toString(),
        purpose: 'course_fees',
        isOverdue: isOverdueYear.toString(),
        penalty: penalty.toString()
      }
    });

    // Create or update fee record
    let feeRecord = await CourseFees.findOne({
      studentId,
      academicYear,
      paymentStatus: 'pending'
    });

    if (feeRecord) {
      feeRecord.amount = feeStructure.totalYearlyFee;
      feeRecord.penalty = penalty;
      feeRecord.finalAmount = finalAmount;
      feeRecord.razorpayOrderId = razorpayOrder.id;
      feeRecord.dueDate = dueDate;
      await feeRecord.save();
    } else {
      const temporaryReceiptNumber = generateReceiptNumber(studentId, academicYear, true);
      
      feeRecord = new CourseFees({
        studentId,
        courseId: student.courseId._id,
        feeType: 'yearly',
        academicYear,
        amount: feeStructure.totalYearlyFee,
        penalty,
        finalAmount,
        dueDate,
        description: `Course fees for ${academicYear} - ${student.courseId.name}${isOverdueYear ? ' (Overdue)' : ''}`,
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: 'pending',
        receiptNumber: temporaryReceiptNumber,
        isTemporary: true
      });
      await feeRecord.save();
    }

    res.status(200).json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      feeRecordId: feeRecord._id,
      feeDetails: {
        baseFee: feeStructure.totalYearlyFee,
        penalty,
        totalAmount: finalAmount,
        academicYear,
        dueDate: dueDate.toISOString(),
        isOverdue: isOverdueYear
      },
      status: true,
      message: "Payment order created successfully",
    });
  } catch (error) {
    console.error(`Error in createFeePaymentOrder: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Helper function to check if a year is overdue
function isYearOverdue(academicYear, currentAcademicYear) {
  const requestedYearStart = parseInt(academicYear.split('-')[0]);
  const currentYearStart = parseInt(currentAcademicYear.split('-')[0]);
  
  // A year is overdue if it's before the current academic year
  return requestedYearStart < currentYearStart;
}


// Verify payment
export const verifyFeePayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      feeRecordId,
    } = req.body;

    console.log('Verifying payment:', {
      razorpay_order_id,
      razorpay_payment_id,
      feeRecordId
    });

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      console.error('Payment signature verification failed');
      return res.status(400).json({
        message: "Invalid payment signature",
        status: false,
      });
    }

    // Get the fee record to extract details for final receipt number
    const existingFeeRecord = await CourseFees.findById(feeRecordId);
    if (!existingFeeRecord) {
      console.error('Fee record not found:', feeRecordId);
      return res.status(404).json({
        message: "Fee record not found",
        status: false,
      });
    }

    // Generate final receipt number (replacing temporary one)
    const finalReceiptNumber = generateReceiptNumber(
      existingFeeRecord.studentId,
      existingFeeRecord.academicYear,
      false // Not temporary
    );

    console.log('Updating fee record with payment details:', {
      feeRecordId,
      finalReceiptNumber,
      razorpay_payment_id
    });

    // **CRITICAL FIX**: Use findByIdAndUpdate with proper options
    const feeRecord = await CourseFees.findByIdAndUpdate(
      feeRecordId,
      {
        paymentStatus: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        paidDate: new Date(),
        transactionId: razorpay_payment_id,
        paymentMethod: 'online',
        receiptNumber: finalReceiptNumber,
        isTemporary: false,
        updatedAt: new Date() // Explicitly set updated timestamp
      },
      { 
        new: true, // Return updated document
        runValidators: true // Run schema validations
      }
    ).populate('studentId', 'name rollno email')
     .populate('courseId', 'name code');

    if (!feeRecord) {
      console.error('Failed to update fee record:', feeRecordId);
      return res.status(404).json({
        message: "Fee record not found after update",
        status: false,
      });
    }

    console.log('Payment verification successful:', {
      feeRecordId: feeRecord._id,
      paymentStatus: feeRecord.paymentStatus,
      paidDate: feeRecord.paidDate,
      receiptNumber: feeRecord.receiptNumber
    });

    res.status(200).json({
      data: feeRecord,
      finalReceiptNumber: finalReceiptNumber,
      message: "Payment verified successfully",
      status: true,
    });
  } catch (error) {
    console.error(`Error in verifyFeePayment: ${error.message}`);
    console.error('Full error stack:', error.stack);
    res.status(500).json({ 
      message: "Server error", 
      status: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const studentId = req.user._id;

    const paymentHistory = await CourseFees.find({
      studentId
    })
    .populate('courseId', 'name code')
    .sort({ academicYear: 1 });

    // Separate payments by status
    const paidPayments = paymentHistory.filter(p => p.paymentStatus === 'paid');
    const duePayments = paymentHistory.filter(p => p.paymentStatus === 'overdue');
    const pendingPayments = paymentHistory.filter(p => p.paymentStatus === 'pending');

    res.status(200).json({
      data: {
        all: paymentHistory,
        paid: paidPayments,
        due: duePayments,
        pending: pendingPayments,
        summary: {
          totalRecords: paymentHistory.length,
          paidCount: paidPayments.length,
          dueCount: duePayments.length,
          pendingCount: pendingPayments.length,
          totalPaidAmount: paidPayments.reduce((sum, p) => sum + p.finalAmount, 0),
          totalDueAmount: duePayments.reduce((sum, p) => sum + p.finalAmount, 0)
        }
      },
      status: true,
    });
  } catch (error) {
    console.error(`Error in getPaymentHistory: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Get due fees with penalties
export const getDueFees = async (req, res) => {
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

    // Get student's academic years
    const enrollmentDate = student.admissionDate || student.createdAt;
    const enrollmentYear = enrollmentDate.getFullYear();
    const enrollmentMonth = enrollmentDate.getMonth() + 1;
    const actualEnrollmentYear = enrollmentMonth >= 7 ? enrollmentYear : enrollmentYear - 1;
    
    const courseDuration = student.courseId.duration || 4;
    const studentAcademicYears = generateStudentAcademicYears(actualEnrollmentYear, courseDuration);

    // Get current fee structure
    const feeStructure = await FeeStructure.getCurrentFeeStructure(student.courseId._id);

    if (!feeStructure) {
      return res.status(404).json({
        message: "Fee structure not found",
        status: false,
      });
    }

    const dueFees = [];
    const currentDate = new Date();

    for (const academicYear of studentAcademicYears) {
      const dueDate = feeStructure.getDueDate(academicYear);

      // Check if year is overdue and not paid
      if (currentDate > dueDate) {
        const existingPayment = await CourseFees.findOne({
          studentId,
          academicYear,
          paymentStatus: 'paid'
        });

        if (!existingPayment) {
          const penalty = feeStructure.calculatePenalty(dueDate, feeStructure.totalYearlyFee);
          
          dueFees.push({
            academicYear,
            baseFee: feeStructure.totalYearlyFee,
            penalty,
            totalAmount: feeStructure.totalYearlyFee + penalty,
            dueDate: dueDate.toISOString(),
            overdueDays: Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24)),
            feeBreakdown: feeStructure.feeBreakdown
          });
        }
      }
    }

    res.status(200).json({
      data: dueFees,
      summary: {
        totalDueRecords: dueFees.length,
        totalDueAmount: dueFees.reduce((sum, fee) => sum + fee.totalAmount, 0),
        totalPenalty: dueFees.reduce((sum, fee) => sum + fee.penalty, 0)
      },
      status: true,
    });
  } catch (error) {
    console.error(`Error in getDueFees: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Get pending fees
export const getPendingFees = async (req, res) => {
  try {
    const studentId = req.user._id;

    const pendingFees = await CourseFees.find({
      studentId,
      paymentStatus: 'pending'
    })
    .populate('courseId', 'name code')
    .sort({ dueDate: 1 });

    res.status(200).json({
      data: pendingFees,
      summary: {
        totalPendingRecords: pendingFees.length,
        totalPendingAmount: pendingFees.reduce((sum, fee) => sum + fee.finalAmount, 0)
      },
      status: true,
    });
  } catch (error) {
    console.error(`Error in getPendingFees: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Admin: Create fee structure
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
      paymentSchedule = "yearly",
      penaltyConfig,
      dueDateConfig,
      effectiveFrom,
      description
    } = req.body;

    // Validate required fields
    if (!courseId || !feeBreakdown || !totalYearlyFee) {
      return res.status(400).json({
        message: "Course ID, fee breakdown, and total yearly fee are required",
        status: false,
      });
    }

    // Deactivate previous fee structure if creating a new one
    if (effectiveFrom) {
      await FeeStructure.updateMany(
        { courseId, isActive: true },
        { 
          isActive: false,
          effectiveTo: new Date(effectiveFrom)
        }
      );
    }

    // Create fee structure
    const feeStructure = new FeeStructure({
      courseId,
      academicYear,
      feeBreakdown,
      totalYearlyFee,
      paymentSchedule,
      penaltyConfig: penaltyConfig || {
        penaltyRate: 0.02,
        maxPenaltyPercent: 0.25,
        gracePeriodDays: 30
      },
      dueDateConfig: dueDateConfig || {
        dueMonth: 7,
        dueDay: 31
      },
      effectiveFrom: effectiveFrom || new Date(),
      description,
      isActive: true,
    });

    await feeStructure.save();

    const populatedStructure = await FeeStructure.findById(feeStructure._id)
      .populate('courseId', 'name code department school duration');

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

// Admin: Update fee structure
export const updateFeeStructure = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Access denied",
        status: false,
      });
    }

    const { structureId } = req.params;
    const updateData = req.body;

    // Find and update the fee structure
    const feeStructure = await FeeStructure.findByIdAndUpdate(
      structureId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).populate('courseId', 'name code department school duration');

    if (!feeStructure) {
      return res.status(404).json({
        message: "Fee structure not found",
        status: false,
      });
    }

    res.status(200).json({
      data: feeStructure,
      message: "Fee structure updated successfully",
      status: true,
    });
  } catch (error) {
    console.error(`Error in updateFeeStructure: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Admin: Get all fee structures
export const getAllFeeStructures = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Access denied",
        status: false,
      });
    }

    const { courseId, isActive, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (courseId) query.courseId = courseId;
    if (typeof isActive === 'string') query.isActive = isActive === 'true';

    const feeStructures = await FeeStructure.find(query)
      .populate('courseId', 'name code department school duration')
      .sort({ effectiveFrom: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FeeStructure.countDocuments(query);

    res.status(200).json({
      data: feeStructures,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      status: true,
    });
  } catch (error) {
    console.error(`Error in getAllFeeStructures: ${error.message}`);
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
      paymentStatus,
      courseId,
      studentId 
    } = req.query;

    const query = {};
    if (academicYear) query.academicYear = academicYear;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (courseId) query.courseId = courseId;
    if (studentId) query.studentId = studentId;

    const feeRecords = await CourseFees.find(query)
      .populate('studentId', 'name rollno email')
      .populate('courseId', 'name code department')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CourseFees.countDocuments(query);

    // Get summary statistics
    const summary = await CourseFees.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$finalAmount' }
        }
      }
    ]);

    res.status(200).json({
      data: feeRecords,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      summary,
      status: true,
    });
  } catch (error) {
    console.error(`Error in getAllFeeRecords: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};
