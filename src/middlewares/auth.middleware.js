// import jwt from "jsonwebtoken";
// import StudentPersonalDetailSchema from "../models/auth.model.js";

// export const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.cookies.new_cookie_sms_jwt;

//     if (!token)
//       return res
//         .status(401)
//         .json({ message: "UnAuthorised User - No Token Provided" });

//     const decodedIdBytoken = jwt.verify(token, process.env.JWT_SECRET_KEY);

//     if (!decodedIdBytoken)
//       return res
//         .status(401)
//         .json({ message: "UnAuthorised User - Invalid Token" });

//     const user = await StudentPersonalDetailSchema.findById(
//       decodedIdBytoken.userId
//     ).select("-password");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     req.user = user;
//     next(); //  calling the next function after middleware
//   } catch (error) {
//     console.log(`Error in protected middleware: ${error}`);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

import jwt from "jsonwebtoken";
import StudentPersonalDetail from "../models/StudentPersonalDetail.js";
import Teacher from "../models/Teacher.js";
import Admin from "../models/Admin.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.new_cookie_sms_jwt;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Not Authorized, no token provided", status: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!decoded || !decoded.role) {
      return res
        .status(401)
        .json({ message: "Not Authorized, invalid token", status: false });
    }

    let user;
    if (decoded.role === "student") {
      user = await StudentPersonalDetail.findById(decoded._id).select(
        "-password"
      );
      if (!user) {
        return res
          .status(404)
          .json({ message: "Student not found", status: false });
      }
    } else if (decoded.role === "teacher") {
      user = await Teacher.findById(decoded._id).select("-password");
      if (!user) {
        return res
          .status(404)
          .json({ message: "Teacher not found", status: false });
      }
    } else if (decoded.role === "admin") {
      user = await Admin.findById(decoded._id).select("-password");
      if (!user) {
        return res
          .status(404)
          .json({ message: "Admin not found", status: false });
      }
    } else {
      return res.status(401).json({ message: "Invalid role", status: false });
    }

    req.user = { ...user.toObject(), role: decoded.role };
    next();
  } catch (error) {
    console.error(`Error in auth middleware: ${error.message}`);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};

export default authMiddleware;
