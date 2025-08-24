// src/controllers/dashboard.controller.js

import StudentPersonalDetail from "../models/Auth.model.js";
import Teacher from "../models/Teacher.model.js";
import Course from "../models/Course.model.js";
import Hostel from "../models/Hostel.model.js";
import BusPass from "../models/BusPass.model.js";
import CourseFees from "../models/CourseFees.model.js";
import Exam from "../models/Exam.model.js";

export const getAdminDashboardStats = async (req, res) => {
    try {
        // Verify admin access
        if (req.user.role !== "admin") {
            return res.status(403).json({
                status: false,
                message: "Access denied. Admin only."
            });
        }

        // Get counts for overview cards
        const [
            totalStudents,
            totalTeachers,
            totalDepartments,
            totalCourses,
            pendingHostelRequests,
            pendingBusPassRequests,
            pendingProfileUpdates
        ] = await Promise.all([
            StudentPersonalDetail.countDocuments(),
            Teacher.countDocuments(),
            Course.distinct('department').then(deps => deps.length),
            Course.countDocuments(),
            Hostel.countDocuments({ allocated: false }),
            BusPass.countDocuments({ status: 'pending' }),
            StudentPersonalDetail.countDocuments({ updatePermissionStatus: 'requested' })
        ]);

        // Get recent activities
        const recentActivities = await Promise.all([
            // Recent student registrations
            StudentPersonalDetail.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name email rollno createdAt'),

            // Recent fee payments
            CourseFees.find({ paymentStatus: 'paid' })
                .sort({ paidDate: -1 })
                .limit(5)
                .populate('studentId', 'name rollno')
                .select('finalAmount paymentMethod paidDate'),

            // Recent hostel applications
            Hostel.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('userId', 'name rollno')
        ]);

        // Get department-wise student distribution
        const departmentDistribution = await Course.aggregate([
            {
                $lookup: {
                    from: 'studentpersonaldetails',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'students'
                }
            },
            {
                $group: {
                    _id: '$department',
                    studentCount: { $sum: { $size: '$students' } },
                    courses: { $push: { name: '$name', count: { $size: '$students' } } }
                }
            }
        ]);

        // Get today's fee collection
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const feeStats = await CourseFees.aggregate([
            {
                $match: {
                    paidDate: { $gte: today, $lte: todayEnd },
                    paymentStatus: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    totalCollection: { $sum: '$finalAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Compile dashboard data
        const dashboardData = {
            overview: {
                totalStudents,
                totalTeachers,
                totalDepartments,
                totalCourses
            },
            pendingActions: {
                hostelRequests: pendingHostelRequests,
                busPassRequests: pendingBusPassRequests,
                profileUpdates: pendingProfileUpdates,
                total: pendingHostelRequests + pendingBusPassRequests + pendingProfileUpdates
            },
            todayStats: {
                feeCollection: feeStats[0]?.totalCollection || 0,
                feeTransactions: feeStats[0]?.count || 0
            },
            recentActivities: {
                newStudents: recentActivities[0],
                recentPayments: recentActivities[1],
                hostelApplications: recentActivities[2]
            },
            departmentStats: departmentDistribution,
            quickLinks: [
                {
                    title: "Add New Student",
                    path: "/admin/students/add"
                },
                {
                    title: "Add New Teacher",
                    path: "/admin/teachers/add"
                },
                {
                    title: "Fee Collection",
                    path: "/admin/fees/collect"
                },
                {
                    title: "View Reports",
                    path: "/admin/reports"
                }
            ]
        };

        // Send success response
        res.status(200).json({
            status: true,
            message: "Dashboard statistics fetched successfully",
            data: dashboardData
        });

    } catch (error) {
        console.error("Error in getAdminDashboardStats:", error);
        res.status(500).json({
            status: false,
            message: "Error fetching dashboard statistics",
            error: error.message
        });
    }
};