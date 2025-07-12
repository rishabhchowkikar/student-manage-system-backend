import Auth from "../models/Auth.model.js";
import cloudinary from "../utils/cloudinary.js";

const checkIfFirstTimeUser = (userData) => {
  const requiredFields = [
    'phone',
    'address', 
    'dob',
    'gender',
    'category',
    'nationality',
    'bloodGroup',
    'aadharNumber',
    'fatherName',
    'motherName'
  ];

  const emptyFields = requiredFields.filter(field => {
    const value = userData[field];
    return !value || value === '';
  });

  console.log('Backend - Empty fields count:', emptyFields.length, 'Empty fields:', emptyFields);
  return emptyFields.length >= 5;
};



export const getProfile = async (req, res) => {
  try {
    const user = await Auth.findById(req.user._id)
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


export const updatePersonalDetailsController = async (req, res) => {
  try {
    const user = await Auth.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        message: "Student not found",
        status: false,
      });
    }

    // UPDATED PERMISSION CHECK - Handle first-time users
    const isFirstTimeUser = checkIfFirstTimeUser(user);
    
    console.log('Is first time user (backend):', isFirstTimeUser);
    console.log('User permission status:', user.updatePermissionStatus);
    
    // Only check permission for existing users (not first-time users)
    if (!isFirstTimeUser && user.updatePermissionStatus !== "approved") {
      return res.status(403).json({
        message: "Admin permission required to update profile",
        status: false,
        permissionStatus: user.updatePermissionStatus,
        needsPermission: true
      });
    }

    // REST OF YOUR EXISTING CODE REMAINS THE SAME...
    let photoUrl = req.body.photo;
    
    // Handle file upload from form-data (multer)
    if (req.file) {
      try {
        console.log("Uploading photo to Cloudinary from form-data...");
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
    // Handle base64 data from JSON request
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
      photo: photoUrl,
      fatherName: req.body.fatherName,
      motherName: req.body.motherName,
      want_to_apply_for_hostel: req.body.want_to_apply_for_hostel,
    };

    // UPDATED - Only reset permission status for existing users
    if (!isFirstTimeUser) {
      updateFields.updatePermissionStatus = "none";
      updateFields.updatePermissionApprovedDate = null;
      updateFields.adminComments = null;
    }

    const filteredUpdates = Object.fromEntries(
      Object.entries(updateFields).filter(([key, value]) => {
        if (key === 'isPwd' || key === 'want_to_apply_for_hostel') return value !== undefined;
        return value !== undefined && value !== null && value !== '';
      })
    );

    console.log("Filtered updates:", filteredUpdates);

    const updatedStudentDetails = await Auth.findByIdAndUpdate(
      req.user._id,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedStudentDetails) {
      return res.status(404).json({ message: "Student not found", status: false });
    }

    res.status(200).json({
      message: isFirstTimeUser ? "Profile completed successfully" : "Personal details updated successfully",
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
};

// updated code to handle update permission request
export const requestUpdatePermission = async (req, res) => {
  try {
    const { reason } = req.body; 
    
    const updatedUser = await Auth.findByIdAndUpdate(
      req.user._id,
      {
        updatePermissionStatus: "requested",
        updatePermissionRequestDate: new Date(),
        updatePermissionReason: reason || "Profile update request"
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "Student not found",
        status: false,
      });
    }

    res.status(200).json({
      message: "Permission request sent to admin successfully",
      status: true,
      permissionStatus: "requested"
    });
  } catch (error) {
    console.error("Error requesting permission:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message
    });
  }
};

export const getUpdatePermissionStatus = async (req, res) => {
  try {
    const user = await Auth.findById(req.user._id)
      .select("updatePermissionStatus updatePermissionRequestDate updatePermissionApprovedDate updatePermissionRejectedDate adminComments");

    if (!user) {
      return res.status(404).json({
        message: "Student not found",
        status: false,
      });
    }

    res.status(200).json({
      status: true,
      permissionData: {
        status: user.updatePermissionStatus,
        requestDate: user.updatePermissionRequestDate,
        approvedDate: user.updatePermissionApprovedDate,
        rejectedDate: user.updatePermissionRejectedDate,
        adminComments: user.adminComments
      }
    });
  } catch (error) {
    console.error("Error getting permission status:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message
    });
  }
};