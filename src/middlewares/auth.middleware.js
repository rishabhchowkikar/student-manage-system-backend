import jwt from "jsonwebtoken";
import User from "../models/auth.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.new_cookie_sms_jwt;

    if (!token)
      return res
        .status(401)
        .json({ message: "UnAuthorised User - No Token Provided" });

    const decodedIdBytoken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decodedIdBytoken)
      return res
        .status(401)
        .json({ message: "UnAuthorised User - Invalid Token" });

    const user = await User.findById(decodedIdBytoken.userId).select(
      "-password"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next(); //  calling the next function after middleware
  } catch (error) {
    console.log(`Error in protected middleware: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};
