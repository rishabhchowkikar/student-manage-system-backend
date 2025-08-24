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

const createChangesSummary = (changesMap) => {
  if (!changesMap || changesMap.size === 0) {
    return "No changes specified";
  }
  
  const summaryParts = [];
  for (const [fieldName, changeData] of changesMap.entries()) {
    // Get display name for field
    const displayNames = {
      'phone': 'Phone Number',
      'altPhone': 'Alternative Phone Number', 
      'address': 'Address',
      'dob': 'Date of Birth',
      'gender': 'Gender',
      'category': 'Category',
      'nationality': 'Nationality',
      'bloodGroup': 'Blood Group',
      'aadharNumber': 'Aadhar Number',
      'fatherName': 'Father Name',
      'motherName': 'Mother Name',
      'want_to_apply_for_hostel': 'Hostel Application',
      'isPwd': 'PWD Status'
    };
    
    const displayName = displayNames[fieldName] || fieldName;
    summaryParts.push(
      `${displayName}: "${changeData.currentValue || 'Empty'}" → "${changeData.newValue}"`
    );
  }
  
  return summaryParts.join('; ');
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

// // updated code to handle update permission request
// export const requestUpdatePermission = async (req, res) => {
//   try {
//     const { reason } = req.body; 
    
//     const updatedUser = await Auth.findByIdAndUpdate(
//       req.user._id,
//       {
//         updatePermissionStatus: "requested",
//         updatePermissionRequestDate: new Date(),
//         updatePermissionReason: reason || "Profile update request"
//       },
//       { new: true }
//     ).select("-password");

//     if (!updatedUser) {
//       return res.status(404).json({
//         message: "Student not found",
//         status: false,
//       });
//     }

//     res.status(200).json({
//       message: "Permission request sent to admin successfully",
//       status: true,
//       permissionStatus: "requested"
//     });
//   } catch (error) {
//     console.error("Error requesting permission:", error.message);
//     res.status(500).json({
//       message: "Internal Server Error",
//       status: false,
//       error: error.message
//     });
//   }
// };

/**
 * UPDATED - Request permission from admin to update profile with specific changes
 * Students can submit detailed information about what they want to change
 * @route POST /request-update-permission
 * @access Private (Student)
 */
export const requestUpdatePermission = async (req, res) => {
  try {
    const { reason, requestedChanges } = req.body;
    
    // Validate that requestedChanges is provided and not empty
    if (!requestedChanges || Object.keys(requestedChanges).length === 0) {
      return res.status(400).json({
        message: "Please specify what changes you want to make",
        status: false,
      });
    }

    // Get current user data to compare with requested changes
    const currentUser = await Auth.findById(req.user._id).select("-password");
    
    if (!currentUser) {
      return res.status(404).json({
        message: "Student not found",
        status: false,
      });
    }

    // Process requested changes and create a Map
    const changesMap = new Map();
    let hasValidChanges = false;

    for (const [fieldName, changeData] of Object.entries(requestedChanges)) {
      // Validate change data structure
      if (!changeData.newValue) {
        continue; // Skip if no new value provided
      }

      const currentValue = currentUser[fieldName] || '';
      
      // Only add to changes if the new value is different from current
      if (currentValue !== changeData.newValue) {
        changesMap.set(fieldName, {
          currentValue: currentValue,
          newValue: changeData.newValue,
          reason: changeData.reason || 'No specific reason provided'
        });
        hasValidChanges = true;
      }
    }

    if (!hasValidChanges) {
      return res.status(400).json({
        message: "No valid changes detected. The requested values are same as current values.",
        status: false,
      });
    }

    // Create a human-readable summary of changes
    const changesSummary = createChangesSummary(changesMap);

    const updatedUser = await Auth.findByIdAndUpdate(
      req.user._id,
      {
        updatePermissionStatus: "requested",
        updatePermissionRequestDate: new Date(),
        updatePermissionReason: reason || "Profile update request",
        requestedChanges: changesMap,
        changesSummary: changesSummary
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
      permissionStatus: "requested",
      changesSummary: changesSummary
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
      .select("updatePermissionStatus updatePermissionRequestDate updatePermissionApprovedDate updatePermissionRejectedDate adminComments requestedChanges changesSummary updatePermissionReason");

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
        adminComments: user.adminComments,
        reason: user.updatePermissionReason,
        requestedChanges: user.requestedChanges,
        changesSummary: user.changesSummary
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

/**
 * UPDATED - Get all students with pending update permission requests
 * Now includes detailed information about requested changes
 * @route GET /admin/pending-update-requests
 * @access Private (Admin)
 */
export const getPendingUpdateRequests = async (req, res) => {
  try {
    const pendingRequests = await Auth.find({
      updatePermissionStatus: "requested"
    })
    .select("name email rollno updatePermissionRequestDate updatePermissionReason courseId requestedChanges changesSummary")
    .populate("courseId", "name")
    .sort({ updatePermissionRequestDate: -1 });

    res.status(200).json({
      message: "Pending update requests fetched successfully",
      status: true,
      data: pendingRequests,
      count: pendingRequests.length
    });
  } catch (error) {
    console.error("Error fetching pending requests:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message
    });
  }
};


/**
 * Approve a student's update permission request
 * Admin function to grant permission for profile updates
 * @route PUT /admin/approve-update-permission/:studentId
 * @access Private (Admin)
 */
export const approveUpdatePermission = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { adminComments } = req.body; // Optional admin comments

    const updatedStudent = await Auth.findByIdAndUpdate(
      studentId,
      {
        updatePermissionStatus: "approved",
        updatePermissionApprovedDate: new Date(),
        updatePermissionRejectedDate: null, // Clear any previous rejection date
        adminComments: adminComments || "Permission approved by admin"
      },
      { new: true }
    ).select("name email rollno updatePermissionStatus updatePermissionApprovedDate adminComments requestedChanges changesSummary");

    if (!updatedStudent) {
      return res.status(404).json({
        message: "Student not found",
        status: false,
      });
    }

    res.status(200).json({
      message: "Update permission approved successfully",
      status: true,
      data: updatedStudent
    });
  } catch (error) {
    console.error("Error approving permission:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message
    });
  }
};


/**
 * Reject a student's update permission request
 * Admin function to deny permission with mandatory comments explaining reason
 * @route PUT /admin/reject-update-permission/:studentId
 * @access Private (Admin)
 */
export const rejectUpdatePermission = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { adminComments } = req.body; // Required for rejection

    if (!adminComments || adminComments.trim() === '') {
      return res.status(400).json({
        message: "Admin comments are required when rejecting a request",
        status: false,
      });
    }

    const updatedStudent = await Auth.findByIdAndUpdate(
      studentId,
      {
        updatePermissionStatus: "rejected",
        updatePermissionRejectedDate: new Date(),
        updatePermissionApprovedDate: null, // Clear any previous approval date
        adminComments: adminComments
      },
      { new: true }
    ).select("name email rollno updatePermissionStatus updatePermissionRejectedDate adminComments requestedChanges changesSummary");

    if (!updatedStudent) {
      return res.status(404).json({
        message: "Student not found",
        status: false,
      });
    }

    res.status(200).json({
      message: "Update permission rejected successfully",
      status: true,
      data: updatedStudent
    });
  } catch (error) {
    console.error("Error rejecting permission:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message
    });
  }
};


/**
 * UPDATED - Get all update permission requests with optional status filtering
 * Now includes detailed information about requested changes
 * @route GET /admin/all-update-requests?status=requested|approved|rejected
 * @access Private (Admin)
 */
export const getAllUpdateRequests = async (req, res) => {
  try {
    const { status } = req.query; // Optional filter by status
    
    let filter = {};
    if (status && ['requested', 'approved', 'rejected'].includes(status)) {
      filter.updatePermissionStatus = status;
    } else {
      // Get all requests except 'none'
      filter.updatePermissionStatus = { $in: ['requested', 'approved', 'rejected'] };
    }

    const requests = await Auth.find(filter)
      .select("name email rollno updatePermissionStatus updatePermissionRequestDate updatePermissionApprovedDate updatePermissionRejectedDate adminComments courseId updatePermissionReason requestedChanges changesSummary")
      .populate("courseId", "name")
      .sort({ updatePermissionRequestDate: -1 });

    res.status(200).json({
      message: "Update requests fetched successfully",
      status: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error("Error fetching update requests:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
      status: false,
      error: error.message
    });
  }
};