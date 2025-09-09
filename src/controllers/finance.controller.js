import Hostel from "../models/Hostel.model.js";
import BusPass from "../models/BusPass.model.js";
import Auth from "../models/Auth.model.js";
import Course from "../models/Course.model.js";
import CourseFees from "../models/CourseFees.model.js";
import mongoose from "mongoose";

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

// ==== HOSTEL PAYMENT CONTROLLERS ====

export const getAllHostelPayments = async (req, res) => {
  try {
    const { 
      status, 
      academicYear, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    // Build query
    let query = {};
    
    if (status) {
      query.paymentStatus = status;
    }
    
    if (academicYear) {
      query.academicYear = academicYear;
    }

    const hostelPayments = await Hostel.find(query)
      .populate({
        path: "userId",
        select: "name email rollno courseId phone",
        model: Auth,
        populate: {
          path: "courseId",
          select: "name department school code",
          model: Course,
        },
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter out entries where userId population failed and apply search
    let filteredPayments = hostelPayments.filter(payment => payment.userId);
    
    if (search) {
      filteredPayments = filteredPayments.filter(payment => 
        payment.userId.name.toLowerCase().includes(search.toLowerCase()) ||
        payment.userId.rollno.toString().includes(search) ||
        payment.userId.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Get total count for pagination
    const total = await Hostel.countDocuments(query);

    res.status(200).json({
      message: "Hostel payments fetched successfully",
      status: true,
      data: filteredPayments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Error in getAllHostelPayments:", error.message);
    res.status(500).json({
      message: "Server error while fetching hostel payments",
      status: false,
      error: error.message
    });
  }
};

export const getHostelPaymentsByAcademicYear = async (req, res) => {
  try {
    const { academicYear } = req.params;

    const payments = await Hostel.find({ academicYear })
      .populate({
        path: "userId",
        select: "name email rollno courseId",
        model: Auth,
        populate: {
          path: "courseId",
          select: "name department school code",
          model: Course,
        },
      })
      .sort({ createdAt: -1 });

    const filteredPayments = payments.filter(payment => payment.userId);

    // Calculate statistics
    const stats = {
      totalPayments: filteredPayments.length,
      paidPayments: filteredPayments.filter(p => p.paymentStatus === 'paid').length,
      pendingPayments: filteredPayments.filter(p => p.paymentStatus === 'pending').length,
      totalAmount: filteredPayments
        .filter(p => p.paymentStatus === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0)
    };

    res.status(200).json({
      message: `Hostel payments for ${academicYear} fetched successfully`,
      status: true,
      data: filteredPayments,
      stats,
      academicYear
    });

  } catch (error) {
    console.error("Error in getHostelPaymentsByAcademicYear:", error.message);
    res.status(500).json({
      message: "Server error while fetching payments by academic year",
      status: false,
      error: error.message
    });
  }
};

// export const getHostelPaymentDetails = async (req, res) => {
//   try {
//     const { paymentId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(paymentId)) {
//       return res.status(400).json({
//         message: "Invalid payment ID format",
//         status: false
//       });
//     }

//     const payment = await Hostel.findById(paymentId)
//       .populate({
//         path: "userId",
//         select: "name email rollno courseId phone address",
//         model: Auth,
//         populate: {
//           path: "courseId",
//           select: "name department school code",
//           model: Course,
//         },
//       });

//     if (!payment) {
//       return res.status(404).json({
//         message: "Hostel payment not found",
//         status: false
//       });
//     }

//     res.status(200).json({
//       message: "Hostel payment details fetched successfully",
//       status: true,
//       data: payment
//     });

//   } catch (error) {
//     console.error("Error in getHostelPaymentDetails:", error.message);
//     res.status(500).json({
//       message: "Server error while fetching payment details",
//       status: false,
//       error: error.message
//     });
//   }
// };

export const getHostelPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        message: "Payment ID is required",
        status: false
      });
    }

    let payment = null;

    // First, check if it's a valid MongoDB ObjectId and search by _id
    if (mongoose.Types.ObjectId.isValid(paymentId) && paymentId.length === 24) {
      payment = await Hostel.findById(paymentId)
        .populate({
          path: "userId",
          select: "name email rollno courseId phone address",
          model: Auth,
          populate: {
            path: "courseId",
            select: "name department school code",
            model: Course,
          },
        });
    }

    // If not found by _id, search by razorpay payment ID or order ID
    if (!payment) {
      payment = await Hostel.findOne({
        $or: [
          { razorpayPaymentId: paymentId },
          { razorpayOrderId: paymentId }
        ]
      }).populate({
        path: "userId",
        select: "name email rollno courseId phone address",
        model: Auth,
        populate: {
          path: "courseId",
          select: "name department school code",
          model: Course,
        },
      });
    }

    if (!payment) {
      return res.status(404).json({
        message: "Hostel payment not found",
        status: false
      });
    }

    res.status(200).json({
      message: "Hostel payment details fetched successfully",
      status: true,
      data: payment
    });

  } catch (error) {
    console.error("Error in getHostelPaymentDetails:", error.message);
    res.status(500).json({
      message: "Server error while fetching payment details",
      status: false,
      error: error.message
    });
  }
};

// export const updateHostelPaymentStatus = async (req, res) => {
//   try {
//     const { paymentId } = req.params;
//     const { paymentStatus, razorpayPaymentId, paymentDate, amount } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(paymentId)) {
//       return res.status(400).json({
//         message: "Invalid payment ID format",
//         status: false
//       });
//     }

//     const updateData = {
//       paymentStatus,
//       updatedAt: new Date()
//     };

//     if (razorpayPaymentId) {
//       updateData.razorpayPaymentId = razorpayPaymentId;
//     }

//     if (paymentDate) {
//       updateData.paymentDate = new Date(paymentDate);
//     }

//     if (amount) {
//       updateData.amount = amount;
//     }

//     const updatedPayment = await Hostel.findByIdAndUpdate(
//       paymentId,
//       updateData,
//       { new: true }
//     ).populate({
//       path: "userId",
//       select: "name email rollno courseId",
//       model: Auth,
//       populate: {
//         path: "courseId",
//         select: "name department school code",
//         model: Course,
//       },
//     });

//     if (!updatedPayment) {
//       return res.status(404).json({
//         message: "Hostel payment record not found",
//         status: false
//       });
//     }

//     res.status(200).json({
//       message: "Hostel payment status updated successfully",
//       status: true,
//       data: updatedPayment
//     });

//   } catch (error) {
//     console.error("Error in updateHostelPaymentStatus:", error.message);
//     res.status(500).json({
//       message: "Server error while updating payment status",
//       status: false,
//       error: error.message
//     });
//   }
// };


export const updateHostelPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { paymentStatus, razorpayPaymentId, paymentDate, amount } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        message: "Payment ID is required",
        status: false
      });
    }

    let payment = null;

    // Check if it's a valid MongoDB ObjectId (24 character hex string)
    if (mongoose.Types.ObjectId.isValid(paymentId) && paymentId.length === 24) {
      payment = await Hostel.findById(paymentId);
    } else {
      // Search by Razorpay payment ID or order ID
      payment = await Hostel.findOne({
        $or: [
          { razorpayPaymentId: paymentId },
          { razorpayOrderId: paymentId }
        ]
      });
    }

    if (!payment) {
      return res.status(404).json({
        message: "Hostel payment record not found",
        status: false
      });
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date()
    };

    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus;
    }

    if (razorpayPaymentId !== undefined) {
      updateData.razorpayPaymentId = razorpayPaymentId;
    }

    if (paymentDate !== undefined) {
      updateData.paymentDate = new Date(paymentDate);
    }

    if (amount !== undefined) {
      updateData.amount = amount;
    }

    // Update the payment using findOneAndUpdate for better control
    const updatedPayment = await Hostel.findOneAndUpdate(
      { _id: payment._id },
      updateData,
      { new: true }
    ).populate({
      path: "userId",
      select: "name email rollno courseId",
      model: Auth,
      populate: {
        path: "courseId",
        select: "name department school code",
        model: Course,
      },
    });

    if (!updatedPayment) {
      return res.status(404).json({
        message: "Failed to update payment record",
        status: false
      });
    }

    res.status(200).json({
      message: "Hostel payment status updated successfully",
      status: true,
      data: updatedPayment
    });

  } catch (error) {
    console.error("Error in updateHostelPaymentStatus:", error.message);
    res.status(500).json({
      message: "Server error while updating payment status",
      status: false,
      error: error.message
    });
  }
};


// ==== BUS PASS PAYMENT CONTROLLERS ====

export const getAllBusPassPayments = async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    let query = {};
    
    if (status) {
      query.status = status;
    }

    const busPassPayments = await BusPass.find(query)
      .populate({
        path: "studentId",
        select: "name email rollno courseId phone address",
        model: Auth,
        populate: {
          path: "courseId",
          select: "name department school code",
          model: Course,
        },
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter by search if provided
    let filteredPayments = busPassPayments.filter(payment => payment.studentId);
    
    if (search) {
      filteredPayments = filteredPayments.filter(payment => 
        payment.studentId.name.toLowerCase().includes(search.toLowerCase()) ||
        payment.studentId.rollno.toString().includes(search) ||
        payment.studentId.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await BusPass.countDocuments(query);

    res.status(200).json({
      message: "Bus pass payments fetched successfully",
      status: true,
      data: filteredPayments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error("Error in getAllBusPassPayments:", error.message);
    res.status(500).json({
      message: "Server error while fetching bus pass payments",
      status: false,
      error: error.message
    });
  }
};

export const getBusPassPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        message: "Invalid payment ID format",
        status: false
      });
    }

    const payment = await BusPass.findById(paymentId)
      .populate({
        path: "studentId",
        select: "name email rollno courseId phone address",
        model: Auth,
        populate: {
          path: "courseId",
          select: "name department school code",
          model: Course,
        },
      });

    if (!payment) {
      return res.status(404).json({
        message: "Bus pass application not found",
        status: false
      });
    }

    res.status(200).json({
      message: "Bus pass payment details fetched successfully",
      status: true,
      data: payment
    });

  } catch (error) {
    console.error("Error in getBusPassPaymentDetails:", error.message);
    res.status(500).json({
      message: "Server error while fetching payment details",
      status: false,
      error: error.message
    });
  }
};

export const updateBusPassPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, paymentAmount, paymentDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        message: "Invalid payment ID format",
        status: false
      });
    }

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (paymentAmount) {
      updateData.paymentAmount = paymentAmount;
    }

    if (paymentDate) {
      updateData.paymentDate = new Date(paymentDate);
    }

    const updatedPayment = await BusPass.findByIdAndUpdate(
      paymentId,
      updateData,
      { new: true }
    ).populate({
      path: "studentId",
      select: "name email rollno courseId",
      model: Auth,
      populate: {
        path: "courseId",
        select: "name department school code",
        model: Course,
      },
    });

    if (!updatedPayment) {
      return res.status(404).json({
        message: "Bus pass payment record not found",
        status: false
      });
    }

    res.status(200).json({
      message: "Bus pass payment status updated successfully",
      status: true,
      data: updatedPayment
    });

  } catch (error) {
    console.error("Error in updateBusPassPaymentStatus:", error.message);
    res.status(500).json({
      message: "Server error while updating payment status",
      status: false,
      error: error.message
    });
  }
};

// ==== STUDENT PAYMENT HISTORY ====

export const getAllStudentsCourseFees = async (req, res) => {
  try {
    // Query params for filtering, pagination
    const { page = 1, limit = 20, paymentStatus, academicYear, courseId, feeType, search } = req.query;
    const query = {};

    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (academicYear) query.academicYear = academicYear;
    if (courseId) query.courseId = courseId;
    if (feeType) query.feeType = feeType;

    // Optional search (by student roll, name, email)
    let studentsFilter = {};
    if (search) {
      studentsFilter = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { rollno: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
      // Get student IDs matching the search criteria
      const matchedStudents = await Auth.find(studentsFilter).select('_id');
      query.studentId = { $in: matchedStudents.map(s => s._id) };
    }

    const fees = await CourseFees.find(query)
      .populate('studentId', 'name rollno email courseId')
      .populate('courseId', 'name code department school')
      .sort({ academicYear: -1, dueDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await CourseFees.countDocuments(query);
    res.status(200).json({
      status: true,
      data: fees,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getAllStudentsCourseFees:', error);
    res.status(500).json({ status: false, message: 'Server error', error: error.message });
  }
};

export const getStudentCourseFees = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, paymentStatus, feeType } = req.query;
    const query = { studentId };

    if (academicYear) query.academicYear = academicYear;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (feeType) query.feeType = feeType;

    const student = await Auth.findById(studentId)
      .populate('courseId', 'name code department school duration');

    if (!student)
      return res.status(404).json({ status: false, message: "Student not found" });

    const feeRecords = await CourseFees.find(query)
      .populate('courseId', 'name code department school')
      .sort({ academicYear: -1, dueDate: 1 });

    res.json({
      status: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          rollno: student.rollno,
          course: student.courseId,
        },
        fees: feeRecords
      }
    });
  } catch (err) {
    console.error("Error in getStudentCourseFees:", err);
    res.status(500).json({ status: false, message: "Server error", error: err.message });
  }
};

// ==== FINANCE DASHBOARD & ANALYTICS ====

export const getDashboardSummary = async (req, res) => {
  try {
    // Hostel summary
    const hostelAgg = await Hostel.aggregate([
      { $group: {
        _id: "$paymentStatus",
        count: { $sum: 1 },
        totalAmount: { $sum: { $ifNull: ["$paymentAmount", 0] } }
      }}
    ]);
    // Course fee summary
    const courseAgg = await CourseFees.aggregate([
      { $group: {
        _id: "$paymentStatus",
        count: { $sum: 1 },
        totalAmount: { $sum: { $ifNull: ["$finalAmount", 0] } }
      }}
    ]);

    // Format results
    const hostelSummary = {};
    hostelAgg.forEach(stat => { hostelSummary[stat._id] = { count: stat.count, amount: stat.totalAmount }; });
    const courseFeesSummary = {};
    courseAgg.forEach(stat => { courseFeesSummary[stat._id] = { count: stat.count, amount: stat.totalAmount }; });

    res.json({
      status: true,
      message: "Dashboard summary fetched successfully",
      data: {
        hostel: hostelSummary,
        courseFees: courseFeesSummary
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, message: "Server error", error: err.message });
  }
};

export const getPendingPayments = async (req, res) => {
  try {
    // Hostel pending payments
    const hostelPending = await Hostel.find({
      paymentStatus: { $in: ["pending", "overdue", "partial", "failed"] }
    })
      .populate("userId", "name rollno email courseId")
      .populate({
        path: "userId.courseId",
        select: "name code department school"
      });

    // Course pending fees
    const coursePending = await CourseFees.find({
      paymentStatus: { $in: ["pending", "overdue", "partial", "failed"] }
    })
      .populate("studentId", "name rollno email courseId")
      .populate({
        path: "courseId",
        select: "name code department school"
      });

    res.json({
      status: true,
      message: "Pending payments fetched successfully",
      data: {
        hostelPending,
        courseFeesPending: coursePending,
        summary: {
          hostel: hostelPending.length,
          course: coursePending.length
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, message: "Server error", error: err.message });
  }
};

// ==== REPORTS & ANALYTICS ====
export const getYearlyReport = async (req, res) => {
  try {
    const yearParam = req.params.year;
    if (!yearParam) {
      return res.status(400).json({ status: false, message: "Year parameter is required" });
    }

    // Determine academicYear value based on param format
    let academicYear;
    if (/^\d{4}$/.test(yearParam)) {
      academicYear = `${yearParam}-${Number(yearParam) + 1}`;
    } else if (/^\d{4}-\d{4}$/.test(yearParam)) {
      academicYear = yearParam;
    } else {
      return res.status(400).json({ status: false, message: "Invalid year parameter format" });
    }

    console.log("Querying payments for academicYear:", academicYear);

    // Fetch payroll payments (with flexible PaymentStatus filtering)
    const hostelPayments = await Hostel.find({ 
      academicYear: academicYear.trim(),
      paymentStatus: { $in: ["paid", "partial"] }  // include partial as well; change as needed
    })
      .populate({
        path: "userId",
        select: "name email rollno",
        populate: {
          path: "courseId",
          select: "name code department school"
        }
      })
      .sort({ academicYear: 1 });

    const coursePayments = await CourseFees.find({ 
      academicYear: academicYear.trim(),
      paymentStatus: { $in: ["paid", "partial"] }
    })
      .populate({
        path: "studentId",
        select: "name email rollno",
        populate: {
          path: "courseId",
          select: "name code department school"
        }
      })
      .sort({ academicYear: 1 });

    if (!hostelPayments.length && !coursePayments.length) {
      return res.status(404).json({ status: false, message: `No payment data found for academic year: ${academicYear}` });
    }

    // Calculate totals safely
    const totalHostelAmount = hostelPayments.reduce((sum, p) => sum + (p.paymentAmount || 0), 0);
    const totalCourseAmount = coursePayments.reduce((sum, p) => sum + (p.finalAmount || 0), 0);

    return res.json({
      status: true,
      message: `Payment report for academic year ${academicYear}`,
      data: {
        academicYear,
        hostelPayments,
        coursePayments,
        summary: {
          totalHostelPayments: hostelPayments.length,
          totalCoursePayments: coursePayments.length,
          totalHostelAmount,
          totalCourseAmount
        }
      }
    });

  } catch (error) {
    console.error("Error fetching yearly report:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// export const getPaymentAnalytics = async (req, res) => {
//   try {
//     // Summarize hostel payment statuses
//     const hostelStatusAgg = await Hostel.aggregate([
//       {
//         $group: {
//           _id: "$paymentStatus",
//           count: { $sum: 1 },
//           totalAmount: { $sum: "$amount" }
//         }
//       }
//     ]);

//     // Summarize course fee payment statuses
//     const courseStatusAgg = await CourseFees.aggregate([
//       {
//         $group: {
//           _id: "$paymentStatus",
//           count: { $sum: 1 },
//           totalAmount: { $sum: "$finalAmount" }
//         }
//       }
//     ]);

//     // Department-wise course fee summary
//     const deptAgg = await CourseFees.aggregate([
//       {
//         $lookup: {
//           from: "auths",
//           localField: "studentId",
//           foreignField: "_id",
//           as: "student"
//         }
//       },
//       { $unwind: "$student" },
//       {
//         $lookup: {
//           from: "courses",
//           localField: "courseId",
//           foreignField: "_id",
//           as: "course"
//         }
//       },
//       { $unwind: "$course" },
//       {
//         $group: {
//           _id: "$course.department",
//           totalPayments: { $sum: 1 },
//           totalPaid: {
//             $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] }
//           },
//           totalOutstanding: {
//             $sum: { $cond: [{ $ne: ["$paymentStatus", "paid"] }, 1, 0] }
//           },
//           totalAmountPaid: {
//             $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$finalAmount", 0] }
//           }
//         }
//       }
//     ]);

//     return res.status(200).json({
//       status: true,
//       message: "Analytics fetched successfully",
//       data: {
//         hostelPaymentStatus: hostelStatusAgg,
//         courseFeesStatus: courseStatusAgg,
//         departmentWiseCourseFees: deptAgg
//       }
//     });
//   } catch (error) {
//     console.error("Error fetching analytics:", error);
//     return res.status(500).json({ status: false, message: "Server error" });
//   }
// };
export const getPaymentAnalytics = async (req, res) => {
  try {
    // Hostel payment stats - use correct field name
    const hostelStatusAgg = await Hostel.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ["$paymentAmount", 0] } } // ✅ Correct field
        }
      }
    ]);

    // Course fee payment stats
    const courseStatusAgg = await CourseFees.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ["$finalAmount", 0] } }
        }
      }
    ]);

    // Enhanced department-wise analysis for better charts
    const departmentAnalysis = await CourseFees.aggregate([
      {
        $lookup: {
          from: "auths",
          localField: "studentId",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: "$student" },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course"
        }
      },
      { $unwind: "$course" },
      {
        $group: {
          _id: {
            department: "$course.department",
            paymentStatus: "$paymentStatus"
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$finalAmount" }
        }
      },
      {
        $group: {
          _id: "$_id.department",
          payments: {
            $push: {
              status: "$_id.paymentStatus",
              count: "$count",
              amount: "$totalAmount"
            }
          },
          totalStudents: { $sum: "$count" },
          totalAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Monthly trend for charts (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyTrends = await Hostel.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          paymentStatus: "paid"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          hostelCount: { $sum: 1 },
          hostelAmount: { $sum: "$paymentAmount" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    const courseFeesTrends = await CourseFees.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          paymentStatus: "paid"
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          courseCount: { $sum: 1 },
          courseAmount: { $sum: "$finalAmount" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    return res.status(200).json({
      status: true,
      message: "Payment analytics fetched successfully",
      data: {
        hostelPaymentStatus: hostelStatusAgg,
        courseFeesStatus: courseStatusAgg,
        departmentWiseAnalysis: departmentAnalysis,
        monthlyTrends: {
          hostel: monthlyTrends,
          courseFees: courseFeesTrends
        },
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};



export const exportPaymentReport = async (req, res) => {
  try {
    const { academicYear, paymentStatus, studentId, courseId } = req.query;

    const hostelQuery = {};
    const courseFeesQuery = {};

    if (academicYear) hostelQuery.academicYear = courseFeesQuery.academicYear = academicYear;
    if (paymentStatus) hostelQuery.paymentStatus = courseFeesQuery.paymentStatus = paymentStatus;
    if (studentId) hostelQuery.userId = courseFeesQuery.studentId = studentId;
    if (courseId) hostelQuery["userId.courseId"] = courseFeesQuery.courseId = courseId;

    const hostelPayments = await Hostel.find(hostelQuery)
      .populate("userId", "name rollno email courseId")
      .populate({
        path: "userId.courseId",
        select: "name code department school"
      });

    const courseFeePayments = await CourseFees.find(courseFeesQuery)
      .populate("studentId", "name rollno email courseId")
      .populate({
        path: "courseId",
        select: "name code department school"
      });

    res.json({
      status: true,
      message: "Payment report exported successfully",
      data: {
        generatedAt: new Date(),
        hostelPayments,
        courseFeePayments,
        summary: {
          hostel: hostelPayments.length,
          course: courseFeePayments.length
        }
      }
    });
  } catch (err) {
    res.status(500).json({ status: false, message: "Server error", error: err.message });
  }
};