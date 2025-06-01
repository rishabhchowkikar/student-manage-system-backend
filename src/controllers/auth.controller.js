import User from "../models/auth.model.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt.js";

export const loginUserController = async (req, res) => {
  const { rollno, email, password } = req.body;
  try {
    if (!rollno || !email || !password)
      return res.status(400).json({ message: "All field are required" });

    const student = await User.findOne({ rollno, email });

    if (!student)
      return res
        .status(401)
        .json({ message: "Invalid credentials - wrong rollno" });

    const checkingPassword = await bcrypt.compare(password, student.password);

    if (!checkingPassword)
      return res
        .status(401)
        .json({ message: "Invalid Credentials - wrong password" });

    generateToken(student._id, res);

    res.status(200).json({
      _id: student._id,
      name: student.name,
      rollno: student.rollno,
      email: student.email,
    });
  } catch (error) {
    console.log(`Error in login controller: ${error}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const signUpUserController = async (req, res) => {
  const { name, rollno, email, password } = req.body;

  try {
    if (!name || !rollno || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 character" });
    }

    const student = await User.findOne({ email, rollno });
    if (student) {
      return res
        .status(400)
        .json({ message: "Student with this email and rollno already exists" });
    }

    // hashing password
    const salt = await bcrypt.genSalt(10);

    const hashPassword = await bcrypt.hash(password, salt);
    const newStudent = new User({
      name,
      rollno,
      email,
      password: hashPassword,
    });

    if (newStudent) {
      generateToken(newStudent._id, res);
      await newStudent.save();

      res.status(201).json({
        _id: newStudent._id,
        name: newStudent.name,
        email: newStudent.email,
        rollno: newStudent.rollno,
      });
    } else {
      res.status(400).json({ message: "Invalid user Data" });
    }
  } catch (error) {
    console.log(`Error in while signing up: ${error.message}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("new_cookie_sms_jwt", "", { maxAge: 0 });
    res.send(200).json({ message: "Log Out Sucessfully" });
  } catch (error) {
    console.log(`Error in the logout Controller: ${error.message}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log(`Error in checkAuth controller: ${error.message}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
