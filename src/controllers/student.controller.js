import StudentPersonalDetailSchema from "../models/auth.model.js";
import cloudinary from "../utils/cloudinary.js";

// export const getProfile = async (req, res) => {
//   try {
//     const user = await StudentPersonalDetailSchema.findById(req.user._id)
//       .populate("courseId")
//       .select("-password");

//     if (!user) {
//       return res.status(404).json({
//         data: { ...user.toObject(), role: req.user.role },
//         status: true,
//       });
//     }
//   } catch (error) {
//     console.log(`error occur: ${error}`)
//   }
// };


export const getProfile = async (req, res) => {
  try {
    const user = await StudentPersonalDetailSchema.findById(req.user._id)
      .populate("courseId")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Student not found",
        status: false,
      });
    }

    return res.status(200).json({
      data: { ...user.toObject(), role: req.user.role },
      status: true,
    });
  } catch (error) {
    console.error("Error in getProfile:", error.message);
    return res.status(500).json({
      message: "Internal server error",
      status: false,
    });
  }
};


// export const updatePersonalDetailsController = async (req, res) => {
//   try {
//     const updateFields = {
//       phone: req.body.phone,
//       altPhone: req.body.phone,
//       mobile: req.body.mobile,
//       address: req.body.address,
//       dob: req.body.dob,
//       gender: req.body.gender,
//       isPwd: req.body.isPwd,
//       category: req.body.category,
//       nationality: req.body.nationality,
//       bloodGroup: req.body.bloodGroup,
//       aadharNumber: req.body.aadharNumber,
//       photo: req.body.photo,
//       fatherName: req.body.fatherName,
//       motherName: req.body.motherName,
//     };

//     const filteredUpdates = Object.fromEntries(
//       Object.entries(updateFields).filter(([_, value]) => value !== undefined)
//     );

//     const updatedStudentDetails =
//       await StudentPersonalDetailSchema.findByIdAndUpdate(
//         req.user._id,
//         { $set: filteredUpdates },
//         { new: true, runValidators: true }
//       ).select("-password");

//     if (!updatedStudentDetails) {
//       return res
//         .status(404)
//         .json({ message: "Student not found", status: false });
//     }

//     res.status(200).json({
//       message: "Personal details updated successfully",
//       status: true,
//       data: { ...updatedStudentDetails.toObject(), role: req.user.role },
//     });
//   } catch (error) {
//     console.log("Error updating personal details:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };


export const updatePersonalDetailsController = async (req, res) => {
  try {
    let photoUrl = req.body.photo; // Keep existing photo URL if no new file is uploaded
    
    // Handle file upload from form-data (multer)
    if (req.file) {
      try {
        console.log("Uploading photo to Cloudinary from form-data...");
        console.log("File info:", {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });
        
        // Convert buffer to base64 for Cloudinary upload
        const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        const uploadResult = await cloudinary.uploader.upload(fileStr, {
          folder: "student-photos",
          public_id: `student_${req.user._id}_${Date.now()}`,
          transformation: [
            { width: 500, height: 500, crop: "fill" },
            { quality: "auto" },
            { format: "auto" },
          ],
          overwrite: true,
        });
        
        photoUrl = uploadResult.secure_url;
        console.log("Photo uploaded successfully:", photoUrl);
      } catch (error) {
        console.error("Error uploading photo to Cloudinary:", error.message);
        return res.status(400).json({
          message: "Error uploading photo to Cloudinary",
          status: false,
          error: error.message,
        });
      }
    }
    // Handle base64 data from JSON request (backward compatibility)
    else if (req.body.photo && req.body.photo.startsWith("data:image/")) {
      try {
        console.log("Uploading photo to Cloudinary from base64...");
        const uploadResult = await cloudinary.uploader.upload(req.body.photo, {
          folder: "student-photos",
          public_id: `student_${req.user._id}_${Date.now()}`,
          transformation: [
            { width: 500, height: 500, crop: "fill" },
            { quality: "auto" },
            { format: "auto" },
          ],
          overwrite: true,
        });
        photoUrl = uploadResult.secure_url;
        console.log("Photo uploaded successfully:", photoUrl);
      } catch (error) {
        console.error("Error uploading base64 photo to Cloudinary:", error.message);
        return res.status(400).json({
          message: "Error uploading photo to Cloudinary",
          status: false,
          error: error.message,
        });
      }
    }

    const updateFields = {
      phone: req.body.phone,
      altPhone: req.body.altPhone, 
      mobile: req.body.mobile,
      address: req.body.address,
      dob: req.body.dob,
      gender: req.body.gender,
      isPwd: req.body.isPwd,
      category: req.body.category,
      nationality: req.body.nationality,
      bloodGroup: req.body.bloodGroup,
      aadharNumber: req.body.aadharNumber,
      photo: photoUrl, // Use the Cloudinary URL or existing URL
      fatherName: req.body.fatherName,
      motherName: req.body.motherName,
    };

    // Filter out undefined values, but keep false values for booleans
    const filteredUpdates = Object.fromEntries(
      Object.entries(updateFields).filter(([key, value]) => {
        if (key === 'isPwd') return value !== undefined; // Keep boolean values
        return value !== undefined && value !== null && value !== '';
      })
    );

    console.log("Filtered updates:", filteredUpdates);

    const updatedStudentDetails = await StudentPersonalDetailSchema.findByIdAndUpdate(
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
    console.error("Error updating personal details:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message
    });
  }
}