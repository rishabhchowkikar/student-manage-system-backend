import Hostel from "../models/Hostel.model.js";

export const updateHostelDetails = async (req, res) => {
  try {
    const { userId, roomType, roomNumber, floor, hostelName, allocated } =
      req.body;
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
    const hostel = await Hostel.findOne({ userId: req.user._id });
    res.status(200).json({ data: hostel, status: true });
  } catch (error) {
    console.error(`Error in getHostelDetails: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};
