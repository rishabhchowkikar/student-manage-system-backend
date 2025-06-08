import StudentPersonalDetail from "../models/auth.model.js";
import Course from "../models/course.model.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt.js";

export const loginStudentController = async (req, res) => {
  const { email, password, rollno } = req.body;

  try {
    if (!email || !password || !rollno) {
      return res
        .status(400)
        .json({ message: "All fields are required", status: false });
    }

    const user = await StudentPersonalDetail.findOne({ rollno, email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid Credentials", status: false });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ message: "Invalid Credentials", status: false });
    }

    generateToken(user._id, "student", res);
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    res.status(200).json({
      message: "Login Successfull",
      status: true,
      data: { ...userWithoutPassword, role: "student" },
    });
  } catch (error) {
    console.error(`Error in loginStudentController: ${error.message}`);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};

export const signUpStudentController = async (req, res) => {
  const { name, email, password, courseId } = req.body;

  try {
    if (!name || !email || !password || !courseId) {
      return res
        .status(400)
        .json({ message: "All fields are required", status: false });
    }

    const student = await StudentPersonalDetail.findOne({ email });
    if (student) {
      return res.status(400).json({
        message: "Student with this email already exists",
        status: false,
      });
    }
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: "Invalid Course", status: false });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const newStudent = new StudentPersonalDetail({
      name,
      email,
      password: hashPassword,
      courseId,
    });
    await newStudent.save();

    generateToken(newStudent._id, "student", res);

    res.status(201).json({
      message: "Student SignUp Successfull",
      status: true,
      data: {
        _id: newStudent._id,
        name: newStudent.name,
        email: newStudent.email,
        role: "student",
      },
    });
  } catch (error) {
    console.error(`Error while signing up student: ${error.message}`);
    res.status(500).json({ message: "Internal server error", status: false });
  }
};

// need one more controller function to udpate the student details
