// src/controllers/hostelBuilding.controller.js
import Hostel from "../models/Hostel.model.js";
import Room from "../models/Room.model.js";
import Building from "../models/Building.model.js";
import Auth from "../models/Auth.model.js";
import Course from "../models/Course.model.js";
import mongoose from "mongoose";
import { populate } from "dotenv";

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

// Create hostel application with TBD values (Admin only)
export const createHostelApplication = async (req, res) => {
  try {
    const { userId, roomType, academicYear, paymentAmount } = req.body;

    if (!userId || !roomType || !paymentAmount) {
      return res.status(400).json({ 
        message: "userId, roomType, and paymentAmount are required", 
        status: false 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId format", status: false });
    }

    const student = await Auth.findById(userId).select("want_to_apply_for_hostel gender");
    if (!student) {
      return res.status(404).json({ message: "Student not found", status: false });
    }

    if (!student.want_to_apply_for_hostel) {
      return res.status(400).json({
        message: "This student has indicated they do not want to apply for a hostel. Please update their preference first.",
        status: false,
      });
    }

    const currentAcademicYear = academicYear || getCurrentAcademicYear();

    const hostel = await Hostel.findOneAndUpdate(
      { userId, academicYear: currentAcademicYear },
      { 
        roomType, 
        roomNumber: "TBD",
        floor: "TBD", 
        hostelName: "TBD", 
        allocated: false,
        academicYear: currentAcademicYear,
        paymentAmount,
        paymentStatus: "pending",
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.json({
      data: hostel,
      status: true,
      message: "Hostel application created successfully. Room allocation pending.",
    });
  } catch (error) {
    console.error(`Error in createHostelApplication: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Get all buildings (Admin only)
export const getAllBuildings = async (req, res) => {
  try {
    const buildings = await Building.find({ isActive: true });
    
    res.json({
      data: buildings,
      status: true,
      message: "Buildings retrieved successfully"
    });
  } catch (error) {
    console.error(`Error in getAllBuildings: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Get building by ID (Admin only)
export const getBuildingById = async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(buildingId)) {
      return res.status(400).json({ message: "Invalid building ID format", status: false });
    }

    const building = await Building.findById(buildingId);
    if (!building) {
      return res.status(404).json({ message: "Building not found", status: false });
    }

    res.json({
      data: building,
      status: true,
      message: "Building retrieved successfully"
    });
  } catch (error) {
    console.error(`Error in getBuildingById: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// Get rooms by building ID (Admin only)
export const getRoomsByBuilding = async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { floor, corridor, roomType } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(buildingId)) {
      return res.status(400).json({ message: "Invalid building ID format", status: false });
    }

    let query = { buildingId, isActive: true };
    
    if (floor !== undefined && floor !== '') {
      query.floor = parseInt(floor);
    }
    if (corridor) {
      query.corridor = corridor;
    }
    if (roomType) {
      query.roomType = roomType;
    }

    const rooms = await Room.find(query)
      .populate('buildingId', 'name type')
      .populate('occupants.studentId', 'name rollno')
      .sort({ floor: 1, corridor: 1, roomNumber: 1 });

    res.json({
      data: rooms,
      status: true,
      message: "Rooms retrieved successfully"
    });
  } catch (error) {
    console.error(`Error in getRoomsByBuilding: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};



export const getStudentsPendingAllocation = async (req, res) => {
  try {
    // 🔧 MINIMAL QUERY: Remove ALL filters temporarily
    let pendingStudents = await Hostel.find({
      paymentStatus: 'paid',
      allocated: false
    })
    .populate({
      path: 'userId',
      select: 'name email rollno courseId gender',
      populate: {
        path: 'courseId',
        select: 'name department school code'
      }
    });    
    // Filter out failed userId populations
    const validStudents = pendingStudents.filter(hostel => hostel.userId);
    res.json({
      data: validStudents,
      status: true,
      message: `Found ${validStudents.length} students pending room allocation`
    });
  } catch (error) {
    console.error(`Error in getStudentsPendingAllocation: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};


// Get available rooms (Admin only)
export const getAvailableRooms = async (req, res) => {
  try {
    const { buildingType, floor, roomType } = req.query;
    
    let buildingQuery = { isActive: true };
    if (buildingType) {
      buildingQuery.type = buildingType;
    }
    
    const buildings = await Building.find(buildingQuery);
    
    if (buildings.length === 0) {
      return res.json({
        data: [],
        status: true,
        message: "No buildings found matching criteria"
      });
    }
    
    let roomQuery = { 
      buildingId: { $in: buildings.map(b => b._id) },
      isActive: true,
      $expr: { $lt: ["$currentOccupancy", "$capacity"] }
    };
    
    if (floor !== undefined && floor !== '') {
      roomQuery.floor = parseInt(floor);
    }
    if (roomType) {
      roomQuery.roomType = roomType;
    }
    
    const availableRooms = await Room.find(roomQuery)
      .populate('buildingId', 'name type wardenName wardenPhone')
      .populate({
        path: 'occupants.studentId',
        select: 'name rollno',
        populate: {
          path: 'courseId',
          select: 'name department school'
        }
      })
      .sort({ floor: 1, corridor: 1, roomNumber: 1 });
    
    const roomsByBuilding = availableRooms.reduce((acc, room) => {
      const buildingName = room.buildingId.name;
      if (!acc[buildingName]) {
        acc[buildingName] = {
          buildingInfo: room.buildingId,
          rooms: []
        };
      }
      acc[buildingName].rooms.push(room);
      return acc;
    }, {});
    
    res.json({
      data: roomsByBuilding,
      totalAvailableRooms: availableRooms.length,
      status: true,
      message: "Available rooms retrieved successfully"
    });
  } catch (error) {
    console.error(`Error in getAvailableRooms: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

// // Allocate room to student (Admin only)
// export const allocateRoom = async (req, res) => {
//   const session = await mongoose.startSession();
  
//   try {
//     await session.withTransaction(async () => {
//       const { hostelId, roomId } = req.body;
      
//       if (!hostelId || !roomId) {
//         throw new Error("Hostel ID and Room ID are required");
//       }
      
//       const hostel = await Hostel.findById(hostelId)
//         .populate('userId', 'name rollno gender')
//         .session(session);
      
//       if (!hostel) {
//         throw new Error("Hostel record not found");
//       }
      
//       if (hostel.paymentStatus !== 'paid') {
//         throw new Error("Payment not completed for this student");
//       }
      
//       if (hostel.allocated) {
//         throw new Error("Student already allocated to a room");
//       }
      
//       const room = await Room.findById(roomId)
//         .populate('buildingId', 'name type')
//         .session(session);
      
//       if (!room || !room.isActive) {
//         throw new Error("Room not found or inactive");
//       }
      
//       if (room.currentOccupancy >= room.capacity) {
//         throw new Error("Room is already at full capacity");
//       }
      
//       // Validate gender matching with building type
//       const studentGender = hostel.userId.gender;
//       const buildingType = room.buildingId.type;
      
//       if ((studentGender === 'male' && buildingType !== 'boys') ||
//           (studentGender === 'female' && buildingType !== 'girls')) {
//         throw new Error(`Cannot allocate ${studentGender} student to ${buildingType} hostel`);
//       }
      
//       // Add student to room
//       await Room.findByIdAndUpdate(
//         roomId,
//         {
//           $push: {
//             occupants: {
//               studentId: hostel.userId._id,
//               allocatedDate: new Date(),
//               academicYear: hostel.academicYear
//             }
//           },
//           $inc: { currentOccupancy: 1 },
//           updatedAt: new Date()
//         },
//         { session }
//       );
      
//       // Update hostel record with allocation details
//       const updatedHostel = await Hostel.findByIdAndUpdate(
//         hostelId,
//         {
//           buildingId: room.buildingId._id,
//           roomId: room._id,
//           roomType: room.roomType,
//           roomNumber: room.roomNumber,
//           floor: room.floor.toString(),
//           hostelName: room.buildingId.name,
//           allocated: true,
//           allocationDate: new Date(),
//           updatedAt: new Date()
//         },
//         { new: true, session }
//       ).populate([
//         {
//           path: 'userId',
//           select: 'name email rollno courseId gender',
//           populate: {
//             path: 'courseId',
//             select: 'name department school code'
//           }
//         },
//         { path: 'buildingId', select: 'name type wardenName wardenPhone' },
//         { path: 'roomId', select: 'roomNumber displayName floor corridor capacity currentOccupancy' }
//       ]);
      
//       res.json({
//         data: updatedHostel,
//         status: true,
//         message: `Room ${room.displayName} allocated successfully to ${hostel.userId.name}`
//       });
//     });
//   } catch (error) {
//     console.error(`Error in allocateRoom: ${error.message}`);
//     res.status(500).json({ 
//       message: error.message || "Server error", 
//       status: false 
//     });
//   } finally {
//     await session.endSession();
//   }
// };

export const allocateRoom = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { userId, buildingId, roomId } = req.body;
      
      if (!userId || !buildingId || !roomId) {
        throw new Error("userId, buildingId, and roomId are all required");
      }
      
      // Find the student's hostel application (latest unallocated)
      const hostel = await Hostel.findOne({
        userId: userId,
        paymentStatus: 'paid',
        allocated: false
      })
      .sort({ createdAt: -1 })
      .populate('userId', 'name rollno gender')
      .session(session);
      
      if (!hostel) {
        throw new Error("No eligible hostel application found for this student");
      }
      
      // Validate the building
      const building = await Building.findById(buildingId).session(session);
      if (!building || !building.isActive) {
        throw new Error("Building not found or inactive");
      }
      
      // Validate the room belongs to the building
      const room = await Room.findOne({
        _id: roomId,
        buildingId: buildingId,
        isActive: true
      }).session(session);
      
      if (!room) {
        throw new Error("Room not found in the specified building");
      }
      
      if (room.currentOccupancy >= room.capacity) {
        throw new Error("Room is already at full capacity");
      }
      
      // Validate room type matches payment
      if (hostel.roomType !== room.roomType) {
        throw new Error(`Student paid for ${hostel.roomType} but selected room is ${room.roomType}`);
      }
      
      // Validate gender with building type
      if ((hostel.userId.gender === 'male' && building.type !== 'boys') ||
          (hostel.userId.gender === 'female' && building.type !== 'girls')) {
        throw new Error(`Cannot allocate ${hostel.userId.gender} student to ${building.type} hostel`);
      }
      
      // Add student to room
      await Room.findByIdAndUpdate(roomId, {
        $push: {
          occupants: {
            studentId: userId,
            allocatedDate: new Date(),
            academicYear: hostel.academicYear
          }
        },
        $inc: { currentOccupancy: 1 },
        updatedAt: new Date()
      }, { session });
      
      // Update hostel application record
      const updatedHostel = await Hostel.findByIdAndUpdate(hostel._id, {
        buildingId: buildingId,     // Store which building allocated
        roomId: roomId,             // Store which room allocated
        roomNumber: room.roomNumber,
        floor: room.floor.toString(),
        hostelName: building.name,  // Store building name
        allocated: true,
        allocationDate: new Date(),
        updatedAt: new Date()
      }, { new: true, session });
      
      res.json({
        data: updatedHostel,
        status: true,
        message: `Room ${room.displayName} in ${building.name} allocated successfully`
      });
    });
  } catch (error) {
    console.error(`Error in allocateRoom: ${error.message}`);
    res.status(500).json({ 
      message: error.message || "Server error", 
      status: false 
    });
  } finally {
    await session.endSession();
  }
};


// Deallocate room (Admin only)
export const deallocateRoom = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const { hostelId } = req.params;
      
      const hostel = await Hostel.findById(hostelId)
        .populate('userId', 'name rollno')
        .session(session);
        
      if (!hostel) {
        throw new Error("Hostel record not found");
      }
      
      if (!hostel.allocated || !hostel.roomId) {
        throw new Error("Student is not currently allocated to any room");
      }
      
      // Remove student from room
      await Room.findByIdAndUpdate(
        hostel.roomId,
        {
          $pull: {
            occupants: { studentId: hostel.userId._id }
          },
          $inc: { currentOccupancy: -1 },
          updatedAt: new Date()
        },
        { session }
      );
      
      // Reset hostel allocation
      const updatedHostel = await Hostel.findByIdAndUpdate(
        hostelId,
        {
          buildingId: null,
          roomId: null,
          roomNumber: "TBD",
          floor: "TBD",
          hostelName: "TBD",
          allocated: false,
          allocationDate: null,
          updatedAt: new Date()
        },
        { new: true, session }
      ).populate('userId', 'name email rollno');
      
      res.json({
        data: updatedHostel,
        status: true,
        message: `Room deallocated successfully for ${hostel.userId.name}`
      });
    });
  } catch (error) {
    console.error(`Error in deallocateRoom: ${error.message}`);
    res.status(500).json({ 
      message: error.message || "Server error", 
      status: false 
    });
  } finally {
    await session.endSession();
  }
};

// Get hostel overview (Admin only)
export const getHostelOverview = async (req, res) => {
  try {
    const { academicYear } = req.query;
    const currentYear = academicYear || getCurrentAcademicYear();
    
    const buildings = await Building.find({ isActive: true });
    
    const overview = await Promise.all(buildings.map(async (building) => {
      const totalRooms = await Room.countDocuments({ buildingId: building._id, isActive: true });
      const occupiedRooms = await Room.countDocuments({ 
        buildingId: building._id, 
        isActive: true,
        currentOccupancy: { $gt: 0 }
      });
      const availableRooms = totalRooms - occupiedRooms;
      
      const totalCapacity = totalRooms * 3; // 3 students per room
      const occupiedSpots = await Room.aggregate([
        { $match: { buildingId: building._id, isActive: true } },
        { $group: { _id: null, total: { $sum: "$currentOccupancy" } } }
      ]);
      
      const occupiedSpotsCount = occupiedSpots.length > 0 ? occupiedSpots[0].total : 0;
      const availableSpots = totalCapacity - occupiedSpotsCount;
      
      const allocatedStudents = await Hostel.countDocuments({
        buildingId: building._id,
        allocated: true,
        academicYear: currentYear
      });
      
      const pendingAllocations = await Hostel.countDocuments({
        paymentStatus: 'paid',
        allocated: false,
        academicYear: currentYear
      });
      
      return {
        building,
        roomStats: {
          total: totalRooms,
          occupied: occupiedRooms,
          available: availableRooms,
          occupancyPercentage: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
        },
        capacityStats: {
          total: totalCapacity,
          occupied: occupiedSpotsCount,
          available: availableSpots,
          occupancyPercentage: totalCapacity > 0 ? Math.round((occupiedSpotsCount / totalCapacity) * 100) : 0
        },
        studentStats: {
          allocated: allocatedStudents,
          pendingAllocation: pendingAllocations
        }
      };
    }));
    
    res.json({
      data: overview,
      academicYear: currentYear,
      status: true,
      message: "Hostel overview retrieved successfully"
    });
  } catch (error) {
    console.error(`Error in getHostelOverview: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};


export const getFullRoomsCount = async (req, res) => {
  try {
    const { buildingId } = req.params;
    
    // Validate building ID
    if (!mongoose.Types.ObjectId.isValid(buildingId)) {
      return res.status(400).json({ message: "Invalid building ID format", status: false });
    }
    
    // Get building info
    const building = await Building.findById(buildingId).select('name type');
    if (!building) {
      return res.status(404).json({ message: "Building not found", status: false });
    }
    
    // Get count of full rooms
    const fullRoomsCount = await Room.countDocuments({
      buildingId: buildingId,
      isActive: true,
      $expr: { $gte: ["$currentOccupancy", "$capacity"] }
    });
    
    // Get total rooms count
    const totalRoomsCount = await Room.countDocuments({
      buildingId: buildingId,
      isActive: true
    });
    
    // ✅ Get detailed information about full rooms and their occupants
    const fullRoomsDetails = await Room.find({
      buildingId: buildingId,
      isActive: true,
      $expr: { $gte: ["$currentOccupancy", "$capacity"] }
    })
    .populate('buildingId', 'name type wardenName wardenPhone')
    .populate({
      path: 'occupants.studentId',
      select: 'name rollno email',
      populate: {
        path: 'courseId',
        select: 'name department school'
      }
    })
    .sort({ floor: 1, corridor: 1, roomNumber: 1 });
    
    res.json({
      data: {
        buildingId: buildingId,
        buildingName: building.name,
        buildingType: building.type,
        fullRooms: fullRoomsCount,
        totalRooms: totalRoomsCount,
        availableRooms: totalRoomsCount - fullRoomsCount,
        occupancyPercentage: totalRoomsCount > 0 ? Math.round((fullRoomsCount / totalRoomsCount) * 100) : 0,
        // ✅ Detailed information about full rooms
        fullRoomsDetails: fullRoomsDetails.map(room => ({
          roomId: room._id,
          roomNumber: room.roomNumber,
          displayName: room.displayName,
          floor: room.floor,
          corridor: room.corridor,
          roomType: room.roomType,
          capacity: room.capacity,
          currentOccupancy: room.currentOccupancy,
          occupants: room.occupants.map(occupant => ({
            studentId: occupant.studentId._id,
            name: occupant.studentId.name,
            rollno: occupant.studentId.rollno,
            email: occupant.studentId.email,
            gender: occupant.studentId.gender,
            course: occupant.studentId.courseId ? occupant.studentId.courseId.name : "N/A",
            department: occupant.studentId.courseId ? occupant.studentId.courseId.department : "N/A",
            school: occupant.studentId.courseId ? occupant.studentId.courseId.school : "N/A",
            allocatedDate: occupant.allocatedDate,
            academicYear: occupant.academicYear
          }))
        }))
      },
      status: true,
      message: `Found ${fullRoomsCount} full rooms out of ${totalRoomsCount} total rooms in ${building.name}`
    });
  } catch (error) {
    console.error(`Error in getFullRoomsCount: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};