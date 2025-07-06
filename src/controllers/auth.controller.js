import Auth from "../models/Auth.model.js";
import bcrypt from "bcrypt";
import Teacher from "../models/Teacher.model.js";

export const logout = (req, res) => {
  try {
    console.log(
      `User logged out: ID=${req.user._id}, Role=${req.user.role
      }, Time=${new Date().toISOString()}`
    );

    if (req.user.role === "student") {
      res.cookie("student_cookie_sms_jwt", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
      });
      res.status(200).json({ message: "Logged out successfully", status: true });
    }

    if (req.user.role === "admin") {
      res.cookie("admin_cookie_sms_jwt", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
      });
      res.status(200).json({ message: "Logged out successfully", status: true });
    }

    if (req.user.role === "teacher") {
      res.cookie("teacher_cookie_sms_jwt", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
      });
      res.status(200).json({ message: "Logged out successfully", status: true });
    }

  } catch (error) {
    console.error(`Error in logout controller: ${error.message}`);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};

export const checkAuth = (req, res) => {
  try {
    res
      .status(200)
      .json({ data: { ...req.user, role: req.user.role }, status: true, message:"User Authenticated Successfully!" });
  } catch (error) {
    console.error(`Error in checkAuth controller: ${error.message}`);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old and new passwords are required", status: false });
    }

    let user;
    if (req.user.role === "student") {
      user = await Auth.findById(req.user._id);
    } else if (req.user.role === "teacher") {
      user = await Teacher.findById(req.user._id);
    } else {
      return res.status(403).json({
        message: "Admins cannot change password through this endpoint",
        status: false,
      });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found", status: false });
    }

    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ message: "Incorrect old password", status: false });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashPassword;
    await user.save();

    res
      .status(200)
      .json({ message: "Password changed successfully", status: true });
  } catch (error) {
    console.error(`Error in changePassword controller: ${error.message}`);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};
