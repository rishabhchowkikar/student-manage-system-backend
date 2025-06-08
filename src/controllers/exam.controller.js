import Exam from "../models/Exam.model.js";

export const updateExamDetails = async (req, res) => {
  try {
    const { studentId, semester, subjects } = req.body;
    const exam = await Exam.findOneAndUpdate(
      { studentId, semester },
      { subjects },
      { new: true, upsert: true }
    );
    res.json({ data: exam, status: true });
  } catch (error) {
    console.error(`Error in updateExamDetails: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const getExamDetails = async (req, res) => {
  try {
    const exams = await Exam.find({ studentId: req.user._id }).populate(
      "subjects.subjectId"
    );
    res.json({ data: exams, status: true });
  } catch (error) {
    console.error(`Error in getExamDetails: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const toggleExamFormAccess = async (req, res) => {
  try {
    const { studentId, semester, isAllowed } = req.body;
    const exam = await Exam.findOneAndUpdate(
      { studentId, semester },
      { "examRegistration.isAllowed": isAllowed },
      { new: true, upsert: true }
    );
    res.json({ data: exam, status: true });
  } catch (error) {
    console.error(`Error in toggleExamFormAccess: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};

export const registerForExam = async (req, res) => {
  try {
    const { semester } = req.body;
    const exam = await Exam.findOne({ studentId: req.user._id, semester });
    if (!exam) {
      return res
        .status(404)
        .json({ message: "Exam record not found", status: false });
    }
    if (!exam.examRegistration.isAllowed) {
      return res
        .status(403)
        .json({ message: "Exam form submission is disabled", status: false });
    }
    if (exam.examRegistration.isSubmitted) {
      return res
        .status(400)
        .json({ message: "Exam form already submitted", status: false });
    }
    exam.examRegistration.isSubmitted = true;
    exam.examRegistration.registrationDate = new Date();
    await exam.save();
    res.json({ data: exam, status: true });
  } catch (error) {
    console.error(`Error in registerForExam: ${error.message}`);
    res.status(500).json({ message: "Server error", status: false });
  }
};
