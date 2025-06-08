import StudentPersonalDetailSchema from "../models/auth.model.js";

export const getProfile = async (req, res) => {
  try {
    const user = await StudentPersonalDetailSchema.findById(req.user._id)
      .populate("courseId")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        data: { ...user.toObject(), role: req.user.role },
        status: true,
      });
    }
  } catch (error) {}
};

export const updatePersonalDetailsController = async (req, res) => {
  try {
    const updateFields = {
      phone: req.body.phone,
      altPhone: req.body.phone,
      mobile: req.body.mobile,
      address: req.body.address,
      dob: req.body.dob,
      gender: req.body.gender,
      isPwd: req.body.isPwd,
      category: req.body.category,
      nationality: req.body.nationality,
      bloodGroup: req.body.bloodGroup,
      aadharNumber: req.body.aadharNumber,
      photo: req.body.photo,
      fatherName: req.body.fatherName,
      motherName: req.body.motherName,
    };

    const filteredUpdates = Object.fromEntries(
      Object.entries(updateFields).filter(([_, value]) => value !== undefined)
    );

    const updatedStudentDetails =
      await StudentPersonalDetailSchema.findByIdAndUpdate(
        req.user._id,
        { $set: filteredUpdates },
        { new: true, runValidators: true }
      ).select("-password");

    if (!updatedStudentDetails) {
      return res
        .status(404)
        .json({ message: "Student not found", status: false });
    }

    res.status(200).json({
      message: "Personal details updated successfully",
      status: true,
      data: { ...updatedStudentDetails.toObject(), role: req.user.role },
    });
  } catch (error) {
    console.log("Error updating personal details:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
