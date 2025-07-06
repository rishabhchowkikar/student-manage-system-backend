import jwt from "jsonwebtoken";
import Auth from "../models/Auth.model.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.new_cookie_sms_jwt;
    if (!token)
      return res.status(401).json({ message: "Not Authorized, no Token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET_key);

    req.user = await Auth.findById(
      decoded.userId
    ).select("-password");
    next();
  } catch (error) {
    res
      .status(401)
      .json({ message: `Not authorized: ${req.cookies?.new_cookie_sms_jwt}` });
    console.log(`error occured in the protect.js file: ${error}`);
  }
};
