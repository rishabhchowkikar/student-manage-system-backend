// const roleMiddleware = (allowedRoles) => (req, res, next) => {
//   if (!allowedRoles.includes(req.user.role)) {
//     return res.status(403).json({ message: "Access denied", status: false });
//   }
//   next();
// };

// export default roleMiddleware;

// new role middleware (role validation in the authMiddleware)
const roleMiddleware = (allowedRoles) => (req, res, next) => {
  // Attach allowedRoles to req for authMiddleware to use
  req.allowedRoles = allowedRoles;

  next();
};

export default roleMiddleware;