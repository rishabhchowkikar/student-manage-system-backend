import Admin from "../models/Admin.model.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt.js";

export const loginAdminController = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "All fields are required", status: false });
    }

    const user = await Admin.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid credentials", status: false });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ message: "Invalid credentials", status: false });
    }

    generateToken(user._id, "admin", res);

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(200).json({
      message: "Login successful",
      status: true,
      data: { ...userWithoutPassword, role: "admin" },
    });
  } catch (error) {
    console.error(`Error in loginAdminController: ${error.message}`);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};

export const signUpAdminController = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "All fields are required", status: false });
    }

    const admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({
        message: "Admin with this email already exists",
        status: false,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      email,
      password: hashPassword,
    });

    await newAdmin.save();

    generateToken(newAdmin._id, "admin", res);

    res.status(201).json({
      _id: newAdmin._id,
      email: newAdmin.email,
      role: "admin",
      status: true,
    });
  } catch (error) {
    console.error(`Error while signing up admin: ${error.message}`);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};
