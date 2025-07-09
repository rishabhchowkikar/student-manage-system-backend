import jwt from "jsonwebtoken";

export const generateToken = (userId, role, res) => {
  const token = jwt.sign({ _id: userId, role }, process.env.JWT_SECRET_KEY, {
    expiresIn: "1d",
  });

  // Set cookie name based on role
  let cookieName;
  switch (role) {
    case "admin":
      cookieName = "admin_cookie_sms_jwt";
      break;
    case "student":
      cookieName = "student_cookie_sms_jwt";
      break;
    case "teacher":
      cookieName = "teacher_cookie_sms_jwt";
      break;
    default:
      throw new Error("Invalid role");
  }

    const isProduction = process.env.NODE_ENV === "production";
  const isHTTPS = process.env.CLIENT_URL?.startsWith("https://");

  res.cookie(cookieName, token, {
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    sameSite: isProduction || isHTTPS ? "none" : "strict",
    secure: isProduction || isHTTPS,
    domain: isProduction ? undefined : undefined, // Let browser handle domain
  });

  return token;
};