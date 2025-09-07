import Hostel from "../models/Hostel.model.js";
import BusPass from "../models/BusPass.model.js";
import Auth from "../models/Auth.model.js";
import Course from "../models/Course.model.js";
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

export const getHostelPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        message: "Invalid payment ID format",
        status: false
      });
    }

    const payment = await Hostel.findById(paymentId)
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

export const updateHostelPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { paymentStatus, razorpayPaymentId, paymentDate, amount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        message: "Invalid payment ID format",
        status: false
      });
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

    if (amount) {
      updateData.amount = amount;
    }

    const updatedPayment = await Hostel.findByIdAndUpdate(
      paymentId,
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
        message: "Hostel payment record not found",
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

export const getStudentAllPayments = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        message: "Invalid student ID format",
        status: false
      });
    }

    // Get student details
    const student = await Auth.findById(studentId)
      .populate("courseId", "name department school code");

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        status: false
      });
    }

    // Get hostel payments
    const hostelPayments = await Hostel.find({ userId: studentId })
      .sort({ academicYear: -1 });

    // Get bus pass payments
    const busPassPayments = await BusPass.find({ studentId })
      .sort({ createdAt: -1 });

    const paymentSummary = {
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        rollno: student.rollno,
        course: student.courseId
      },
      hostelPayments: {
        total: hostelPayments.length,
        paid: hostelPayments.filter(p => p.paymentStatus === 'paid').length,
        pending: hostelPayments.filter(p => p.paymentStatus === 'pending').length,
        records: hostelPayments
      },
      busPassPayments: {
        total: busPassPayments.length,
        approved: busPassPayments.filter(p => p.status === 'approved').length,
        pending: busPassPayments.filter(p => p.status === 'pending').length,
        records: busPassPayments
      }
    };

    res.status(200).json({
      message: "Student payment history fetched successfully",
      status: true,
      data: paymentSummary
    });

  } catch (error) {
    console.error("Error in getStudentAllPayments:", error.message);
    res.status(500).json({
      message: "Server error while fetching student payments",
      status: false,
      error: error.message
    });
  }
};

export const getStudentPaymentHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { type } = req.query; // 'hostel' or 'buspass'

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        message: "Invalid student ID format",
        status: false
      });
    }

    const student = await Auth.findById(studentId)
      .populate("courseId", "name department school code");

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
        status: false
      });
    }

    let paymentHistory = [];

    if (!type || type === 'hostel') {
      const hostelPayments = await Hostel.find({ userId: studentId })
        .sort({ createdAt: -1 });
      
      paymentHistory = [...paymentHistory, ...hostelPayments.map(p => ({
        ...p.toObject(),
        type: 'hostel'
      }))];
    }

    if (!type || type === 'buspass') {
      const busPassPayments = await BusPass.find({ studentId })
        .sort({ createdAt: -1 });
      
      paymentHistory = [...paymentHistory, ...busPassPayments.map(p => ({
        ...p.toObject(),
        type: 'buspass'
      }))];
    }

    // Sort by creation date
    paymentHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      message: "Student payment history fetched successfully",
      status: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          rollno: student.rollno,
          course: student.courseId
        },
        paymentHistory
      }
    });

  } catch (error) {
    console.error("Error in getStudentPaymentHistory:", error.message);
    res.status(500).json({
      message: "Server error while fetching payment history",
      status: false,
      error: error.message
    });
  }
};

// ==== FINANCE DASHBOARD & ANALYTICS ====

export const getPaymentSummary = async (req, res) => {
  try {
    const currentYear = getCurrentAcademicYear();

    // Hostel payment stats
    const hostelStats = await Hostel.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    // Bus pass stats
    const busPassStats = await BusPass.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly payment trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Hostel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 },
          amount: { $sum: "$amount" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    const summary = {
      hostelPayments: {
        total: hostelStats.reduce((sum, stat) => sum + stat.count, 0),
        paid: hostelStats.find(s => s._id === 'paid')?.count || 0,
        pending: hostelStats.find(s => s._id === 'pending')?.count || 0,
        totalRevenue: hostelStats.find(s => s._id === 'paid')?.totalAmount || 0
      },
      busPassApplications: {
        total: busPassStats.reduce((sum, stat) => sum + stat.count, 0),
        approved: busPassStats.find(s => s._id === 'approved')?.count || 0,
        pending: busPassStats.find(s => s._id === 'pending')?.count || 0,
        rejected: busPassStats.find(s => s._id === 'rejected')?.count || 0
      },
      monthlyTrends,
      currentAcademicYear: currentYear
    };

    res.status(200).json({
      message: "Payment summary fetched successfully",
      status: true,
      data: summary
    });

  } catch (error) {
    console.error("Error in getPaymentSummary:", error.message);
    res.status(500).json({
      message: "Server error while generating payment summary",
      status: false,
      error: error.message
    });
  }
};

export const getPendingPayments = async (req, res) => {
  try {
    // Get pending hostel payments
    const pendingHostelPayments = await Hostel.find({ 
      paymentStatus: 'pending' 
    })
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

    // Get pending bus pass applications
    const pendingBusPassApplications = await BusPass.find({ 
      status: 'pending' 
    })
    .populate({
      path: "studentId",
      select: "name email rollno courseId",
      model: Auth,
      populate: {
        path: "courseId",
        select: "name department school code",
        model: Course,
      },
    })
    .sort({ createdAt: -1 });

    const summary = {
      pendingHostelPayments: {
        count: pendingHostelPayments.length,
        records: pendingHostelPayments.filter(p => p.userId)
      },
      pendingBusPassApplications: {
        count: pendingBusPassApplications.length,
        records: pendingBusPassApplications.filter(p => p.studentId)
      },
      totalPending: pendingHostelPayments.length + pendingBusPassApplications.length
    };

    res.status(200).json({
      message: "Pending payments fetched successfully",
      status: true,
      data: summary
    });

  } catch (error) {
    console.error("Error in getPendingPayments:", error.message);
    res.status(500).json({
      message: "Server error while fetching pending payments",
      status: false,
      error: error.message
    });
  }
};

// ==== REPORTS & ANALYTICS ====

export const getMonthlyPaymentReport = async (req, res) => {
  try {
    const { year, month } = req.params;

    if (!year || !month) {
      return res.status(400).json({
        message: "Year and month are required",
        status: false
      });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    // Get hostel payments for the month
    const hostelPayments = await Hostel.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate({
      path: "userId",
      select: "name email rollno courseId",
      model: Auth,
      populate: {
        path: "courseId",
        select: "name department school code",
        model: Course,
      },
    });

    // Get bus pass payments for the month
    const busPassPayments = await BusPass.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate({
      path: "studentId",
      select: "name email rollno courseId",
      model: Auth,
      populate: {
        path: "courseId",
        select: "name department school code",
        model: Course,
      },
    });

    const report = {
      period: {
        month: parseInt(month),
        year: parseInt(year),
        startDate,
        endDate
      },
      hostelPayments: {
        total: hostelPayments.length,
        paid: hostelPayments.filter(p => p.paymentStatus === 'paid').length,
        pending: hostelPayments.filter(p => p.paymentStatus === 'pending').length,
        totalRevenue: hostelPayments
          .filter(p => p.paymentStatus === 'paid')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        records: hostelPayments.filter(p => p.userId)
      },
      busPassApplications: {
        total: busPassPayments.length,
        approved: busPassPayments.filter(p => p.status === 'approved').length,
        pending: busPassPayments.filter(p => p.status === 'pending').length,
        rejected: busPassPayments.filter(p => p.status === 'rejected').length,
        records: busPassPayments.filter(p => p.studentId)
      }
    };

    res.status(200).json({
      message: `Monthly payment report for ${month}/${year} fetched successfully`,
      status: true,
      data: report
    });

  } catch (error) {
    console.error("Error in getMonthlyPaymentReport:", error.message);
    res.status(500).json({
      message: "Server error while generating monthly report",
      status: false,
      error: error.message
    });
  }
};

export const getPaymentAnalytics = async (req, res) => {
  try {
    // Payment status distribution
    const hostelStatusDistribution = await Hostel.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    const busPassStatusDistribution = await BusPass.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Department-wise payment analysis
    const departmentWisePayments = await Hostel.aggregate([
      {
        $lookup: {
          from: "auths",
          localField: "userId",
          foreignField: "_id",
          as: "student"
        }
      },
      {
        $unwind: "$student"
      },
      {
        $lookup: {
          from: "courses",
          localField: "student.courseId",
          foreignField: "_id",
          as: "course"
        }
      },
      {
        $unwind: "$course"
      },
      {
        $group: {
          _id: "$course.department",
          totalPayments: { $sum: 1 },
          paidPayments: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amount", 0] }
          }
        }
      }
    ]);

    const analytics = {
      hostelPaymentStatus: hostelStatusDistribution,
      busPassApplicationStatus: busPassStatusDistribution,
      departmentWiseAnalysis: departmentWisePayments,
      generatedAt: new Date()
    };

    res.status(200).json({
      message: "Payment analytics fetched successfully",
      status: true,
      data: analytics
    });

  } catch (error) {
    console.error("Error in getPaymentAnalytics:", error.message);
    res.status(500).json({
      message: "Server error while generating analytics",
      status: false,
      error: error.message
    });
  }
};

// ==== BULK OPERATIONS ====

export const bulkUpdatePaymentStatus = async (req, res) => {
  try {
    const { paymentIds, paymentStatus, paymentType } = req.body;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        message: "Payment IDs array is required",
        status: false
      });
    }

    if (!paymentStatus) {
      return res.status(400).json({
        message: "Payment status is required",
        status: false
      });
    }

    let updateResult;

    if (paymentType === 'hostel') {
      updateResult = await Hostel.updateMany(
        { _id: { $in: paymentIds } },
        { 
          paymentStatus,
          updatedAt: new Date()
        }
      );
    } else if (paymentType === 'buspass') {
      updateResult = await BusPass.updateMany(
        { _id: { $in: paymentIds } },
        { 
          status: paymentStatus,
          updatedAt: new Date()
        }
      );
    } else {
      return res.status(400).json({
        message: "Payment type must be 'hostel' or 'buspass'",
        status: false
      });
    }

    res.status(200).json({
      message: `Bulk update completed successfully. ${updateResult.modifiedCount} records updated.`,
      status: true,
      data: {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
        paymentType,
        paymentStatus
      }
    });

  } catch (error) {
    console.error("Error in bulkUpdatePaymentStatus:", error.message);
    res.status(500).json({
      message: "Server error while performing bulk update",
      status: false,
      error: error.message
    });
  }
};

export const exportPaymentReport = async (req, res) => {
  try {
    const { 
      type = 'all', 
      status, 
      academicYear,
      startDate,
      endDate 
    } = req.query;

    let hostelPayments = [];
    let busPassPayments = [];

    // Build query filters
    let hostelQuery = {};
    let busPassQuery = {};

    if (status) {
      hostelQuery.paymentStatus = status;
      busPassQuery.status = status;
    }

    if (academicYear) {
      hostelQuery.academicYear = academicYear;
    }

    if (startDate && endDate) {
      const dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
      hostelQuery = { ...hostelQuery, ...dateFilter };
      busPassQuery = { ...busPassQuery, ...dateFilter };
    }

    // Fetch data based on type
    if (type === 'all' || type === 'hostel') {
      hostelPayments = await Hostel.find(hostelQuery)
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
    }

    if (type === 'all' || type === 'buspass') {
      busPassPayments = await BusPass.find(busPassQuery)
        .populate({
          path: "studentId",
          select: "name email rollno courseId",
          model: Auth,
          populate: {
            path: "courseId",
            select: "name department school code",
            model: Course,
          },
        })
        .sort({ createdAt: -1 });
    }

    const exportData = {
      exportMetadata: {
        generatedAt: new Date(),
        type,
        filters: { status, academicYear, startDate, endDate }
      },
      hostelPayments: hostelPayments.filter(p => p.userId),
      busPassPayments: busPassPayments.filter(p => p.studentId),
      summary: {
        totalHostelPayments: hostelPayments.length,
        totalBusPassApplications: busPassPayments.length,
        totalRecords: hostelPayments.length + busPassPayments.length
      }
    };

    res.status(200).json({
      message: "Payment report exported successfully",
      status: true,
      data: exportData
    });

  } catch (error) {
    console.error("Error in exportPaymentReport:", error.message);
    res.status(500).json({
      message: "Server error while exporting payment report",
      status: false,
      error: error.message
    });
  }
};
