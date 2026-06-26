const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { authenticate } = require("../middleware/auth");
const { sendPasswordResetEmail } = require("../services/emailService");

const router = express.Router();

const signToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

router.post("/signup", async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide userName, email, and password",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    const user = await User.create({ userName, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: "Account created successfully! Welcome to Career Intel.",
      token,
      data: {
        user: {
          id: user._id,
          userName: user.userName,
          email: user.email,
          resumeCount: user.resumeCount,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(". "),
      });
    }

    console.error("Signup error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create account: " + error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    await user.updateLastActive();
    const token = signToken(user._id);

    res.json({
      success: true,
      message: "Logged in successfully!",
      token,
      data: {
        user: {
          id: user._id,
          userName: user.userName,
          email: user.email,
          resumeCount: user.resumeCount,
          lastActive: user.lastActive,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      message: "Login failed: " + error.message,
    });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide email",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+resetPasswordToken +resetPasswordExpires");

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
      const expiresAt = Date.now() + 15 * 60 * 1000;

      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpires = expiresAt;
      await user.save({ validateBeforeSave: false });

      const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3001").replace(/\/$/, "");
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
      const mail = await sendPasswordResetEmail({ to: user.email, resetUrl });

      if (!mail.delivered) {
        console.log("Password reset preview URL:", mail.previewUrl);
      }
    }

    return res.json({
      success: true,
      message: "If this email exists, a password reset link has been sent.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to process forgot-password request: " + error.message,
    });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset token is invalid or expired.",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const tokenJwt = signToken(user._id);

    return res.json({
      success: true,
      message: "Password reset successful.",
      token: tokenJwt,
      data: {
        user: {
          id: user._id,
          userName: user.userName,
          email: user.email,
          resumeCount: user.resumeCount,
          lastActive: user.lastActive,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reset password: " + error.message,
    });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          userName: req.user.userName,
          email: req.user.email,
          resumeCount: req.user.resumeCount,
          lastActive: req.user.lastActive,
          createdAt: req.user.createdAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile: " + error.message,
    });
  }
});

module.exports = router;
