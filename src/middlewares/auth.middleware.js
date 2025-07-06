// new authMiddleware
import jwt from "jsonwebtoken";
import Auth from "../models/Auth.model.js";
import Teacher from "../models/Teacher.model.js";
import Admin from "../models/Admin.model.js";

const authMiddleware = async (req, res, next) => {
  try {
    // Ensure allowedRoles is set by roleMiddleware
    if (!req.allowedRoles || !Array.isArray(req.allowedRoles)) {
      return res.status(500).json({ message: "Server error: Allowed roles not defined", status: false });
    }

    // Map roles to their respective cookie names
    const roleToCookieMap = {
      admin: "admin_cookie_sms_jwt",
      student: "student_cookie_sms_jwt",
      teacher: "teacher_cookie_sms_jwt",
    };

    let token;
    let decodedRole;

    // Check for a valid token among the allowed roles
    for (const role of req.allowedRoles) {
      const cookieName = roleToCookieMap[role];
      if (!cookieName) {
        continue; // Skip invalid roles
      }

      token = req.cookies?.[cookieName];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
          if (decoded && decoded.role === role) {
            decodedRole = role;
            req.decoded = decoded; // Store decoded token for user lookup
            break;
          }
        } catch (error) {
          // Token is invalid, continue to check the next role
          continue;
        }
      }
    }

    // If no valid token is found for any allowed role
    if (!token || !decodedRole) {
      return res.status(401).json({ message: "Not Authorized, no valid token provided", status: false });
    }

    // Fetch user based on the role
    let user;
    if (decodedRole === "student") {
      user = await Auth.findById(req.decoded._id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "Student not found", status: false });
      }
    } else if (decodedRole === "teacher") {
      user = await Teacher.findById(req.decoded._id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "Teacher not found", status: false });
      }
    } else if (decodedRole === "admin") {
      user = await Admin.findById(req.decoded._id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "Admin not found", status: false });
      }
    } else {
      return res.status(401).json({ message: "Invalid role", status: false });
    }

    // Ensure the decoded role matches one of the allowed roles
    if (!req.allowedRoles.includes(decodedRole)) {
      return res.status(403).json({ message: "Access denied", status: false });
    }

    req.user = { ...user.toObject(), role: decodedRole };
    next();
  } catch (error) {
    console.error(`Error in auth middleware: ${error.message}`);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};

export default authMiddleware;
