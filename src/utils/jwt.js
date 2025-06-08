import jwt from "jsonwebtoken";

export const generateToken = (userId, role, res) => {
  const token = jwt.sign({ _id: userId, role }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });

  res.cookie("new_cookie_sms_jwt", token, {
    maxAge: 1 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};
