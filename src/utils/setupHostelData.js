// utils/runSetup.js
import mongoose from "mongoose";
import Building from "../models/Building.model.js";
import Room from "../models/Room.model.js";


// Replace with your actual MongoDB connection string
const MONGO_URI = process.env.MONGO_URI; 
// OR for MongoDB Atlas: "mongodb+srv://username:password@cluster.mongodb.net/database_name"

const createHostelInfrastructure = async () => {
  try {
    // ✅ Connect to MongoDB FIRST
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Clear existing data (optional)
    await Building.deleteMany({});
    await Room.deleteMany({});
    console.log("🗑️ Cleared existing hostel data");

    // Create Boys Hostel
    const boysHostel = new Building({
      name: "Boys Hostel Block A",
      type: "boys",
      totalFloors: 3,
      floorConfig: {
        groundFloor: {
          totalRooms: 20,
          roomPrefix: "0"
        },
        upperFloors: {
          leftCorridor: 20,
          rightCorridor: 20,
          roomPrefixLeft: "L",
          roomPrefixRight: "R"
        }
      },
      wardenName: "Mr. Rajesh Kumar",
      wardenPhone: "9876543210",
      caretakerName: "Mr. Suresh Singh",
      caretakerPhone: "9876543211"
    });
    
    await boysHostel.save();
    console.log("✅ Boys Hostel created:", boysHostel._id);

    // Create Girls Hostel
    const girlsHostel = new Building({
      name: "Girls Hostel Block A", 
      type: "girls",
      totalFloors: 3,
      floorConfig: {
        groundFloor: {
          totalRooms: 20,
          roomPrefix: "0"
        },
        upperFloors: {
          leftCorridor: 20,
          rightCorridor: 20,
          roomPrefixLeft: "L",
          roomPrefixRight: "R"
        }
      },
      wardenName: "Mrs. Priya Sharma",
      wardenPhone: "9876543212",
      caretakerName: "Mrs. Sunita Devi",
      caretakerPhone: "9876543213"
    });
    
    await girlsHostel.save();
    console.log("✅ Girls Hostel created:", girlsHostel._id);

    // Create rooms for both hostels
    await createRoomsForBuilding(boysHostel);
    await createRoomsForBuilding(girlsHostel);
    
    console.log("🎉 Hostel infrastructure setup completed!");
    
    // ✅ Close the connection
    await mongoose.disconnect();
    console.log("📴 Disconnected from MongoDB");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Error creating hostel infrastructure:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

const createRoomsForBuilding = async (building) => {
  const rooms = [];
  
  // Ground floor rooms (20 rooms)
  for (let roomNum = 1; roomNum <= 20; roomNum++) {
    const paddedNum = roomNum.toString().padStart(3, '0');
    const roomNumber = `${building.floorConfig.groundFloor.roomPrefix}${paddedNum}`;
    
    rooms.push({
      buildingId: building._id,
      roomNumber: roomNumber,
      displayName: `Ground-${paddedNum}`,
      floor: 0,
      corridor: "ground",
      roomType: roomNum % 4 === 0 ? "AC" : "Normal",
      capacity: 3,
      currentOccupancy: 0,
      occupants: []
    });
  }
  
  // Upper floors (Floor 1 and 2)
  for (let floor = 1; floor <= 2; floor++) {
    // Left corridor
    for (let roomNum = 1; roomNum <= 20; roomNum++) {
      const paddedNum = roomNum.toString().padStart(2, '0');
      const roomNumber = `${building.floorConfig.upperFloors.roomPrefixLeft}${floor}${paddedNum}`;
      
      rooms.push({
        buildingId: building._id,
        roomNumber: roomNumber,
        displayName: `Floor${floor}-Left-${paddedNum}`,
        floor: floor,
        corridor: "left",
        roomType: roomNum % 5 === 0 ? "AC" : "Normal",
        capacity: 3,
        currentOccupancy: 0,
        occupants: []
      });
    }
    
    // Right corridor
    for (let roomNum = 1; roomNum <= 20; roomNum++) {
      const paddedNum = roomNum.toString().padStart(2, '0');
      const roomNumber = `${building.floorConfig.upperFloors.roomPrefixRight}${floor}${paddedNum}`;
      
      rooms.push({
        buildingId: building._id,
        roomNumber: roomNumber,
        displayName: `Floor${floor}-Right-${paddedNum}`,
        floor: floor,
        corridor: "right",
        roomType: roomNum % 5 === 0 ? "AC" : "Normal",
        capacity: 3,
        currentOccupancy: 0,
        occupants: []
      });
    }
  }
  
  await Room.insertMany(rooms);
  console.log(`✅ Created ${rooms.length} rooms for ${building.name}`);
};

// Run the setup
createHostelInfrastructure();
