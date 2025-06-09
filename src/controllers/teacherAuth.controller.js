import Teacher from "../models/Teacher.model.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt.js";

export const loginTeacherController = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "All fields are required", status: false });
    }

    const user = await Teacher.findOne({ email });
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

    generateToken(user._id, "teacher", res);

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(200).json({
      message: "Login successful",
      status: true,
      data: { ...userWithoutPassword, role: "teacher" },
    });
  } catch (error) {
    console.error(`Error in loginTeacherController: ${error.message}`);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};

export const signUpTeacherController = async (req, res) => {
  const { name, email, password, department, role } = req.body;

  try {
    if (!name || !email || !password || !department || !role) {
      return res
        .status(400)
        .json({ message: "All fields are required", status: false });
    }

    const teacher = await Teacher.findOne({ email });
    if (teacher) {
      return res.status(400).json({
        message: "Teacher with this email already exists",
        status: false,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newTeacher = new Teacher({
      name,
      email,
      password: hashPassword,
      department,
      role,
    });

    await newTeacher.save();

    generateToken(newTeacher._id, "teacher", res);

    res.status(201).json({
      _id: newTeacher._id,
      name: newTeacher.name,
      email: newTeacher.email,
      department: newTeacher.department,
      role: "teacher",
      status: true,
    });
  } catch (error) {
    console.error(`Error while signing up teacher: ${error.message}`);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};
