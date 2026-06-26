const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── What is Middleware? ───────────────────────────────────────────────────────
// Middleware is code that runs BETWEEN the request arriving and your route running.
// Think of it like a security guard at a door:
//   Request → [auth middleware checks token] → Route handler runs
// If the token is invalid, the guard stops the request right there.

// ─── authenticate ─────────────────────────────────────────────────────────────
// This middleware protects routes that require login.
// It reads the JWT token from the request header and verifies it.
// If valid → attaches the user to req.user and lets the request continue.
// If invalid → immediately returns a 401 Unauthorized error.

const authenticate = async (req, res, next) => {
  try {
    // Tokens are sent in the "Authorization" header like:
    // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
        hint: "Add 'Authorization: Bearer <your_token>' to request headers",
      });
    }

    // Extract just the token part (remove "Bearer " prefix)
    const token = authHeader.split(" ")[1];

    // Verify the token using our secret key
    // If the token is fake or expired, jwt.verify() will throw an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in database using the ID stored inside the token
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    // Attach user to request object so route handlers can access it
    // e.g., in resumeController.js we use req.user._id
    req.user = user;

    // Call next() to pass control to the actual route handler
    next();

  } catch (error) {
    // Handle specific JWT errors with clear messages
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication error: " + error.message,
    });
  }
};

module.exports = { authenticate };
