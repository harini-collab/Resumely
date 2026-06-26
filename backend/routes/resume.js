const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticate } = require("../middleware/auth");
const {
  uploadResume,
  analyzeResumeHandler,
  improveResume,
  compareResumes,
  getProgress,
  getResume,
  listResumes,
  deleteResume,
} = require("../controllers/resumeController");

const router = express.Router();

// ─── Multer Setup ──────────────────────────────────────────────────────────────
// Multer is a middleware that handles file uploads.
// Think of it as the "file receiver" — it catches the PDF sent from frontend
// and saves it temporarily on the server so we can read it.

// Make sure the uploads folder exists (use absolute path to avoid race issues)
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "/tmp/resumely-uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure where and how to store uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);  // save to /uploads folder
  },
  filename: (req, file, cb) => {
    // Give each file a unique name using timestamp to avoid conflicts
    // e.g., resume-1703123456789.pdf
    const uniqueName = `resume-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Only allow PDF and TXT files
const fileFilter = (req, file, cb) => {
  const allowedTypes = [".pdf", ".txt"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);   // accept the file
  } else {
    cb(new Error("Only PDF and TXT files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB max
  },
});

// ─── Routes ───────────────────────────────────────────────────────────────────
// All routes below are protected — user must be logged in (valid JWT token).
// The authenticate middleware runs BEFORE the controller function.

// Upload a resume PDF → extract text → save to DB
router.post("/upload", authenticate, upload.single("resume"), uploadResume);

// Analyze an uploaded resume against a job role.
// Supports two modes:
//   1. Pass resumeId (from a previous /upload call) — no file needed.
//   2. Pass a fresh file (no resumeId) — multer will handle it inline.
// We apply upload.single only when no resumeId is in the body.
router.post("/analyze", authenticate, (req, res, next) => {
  // If a resumeId is already provided, skip multer entirely
  if (req.body && req.body.resumeId) {
    return next();
  }
  // Otherwise accept an optional file
  upload.single("resume")(req, res, next);
}, analyzeResumeHandler);

// Improve weak resume bullet points using AI
router.post("/improve", authenticate, improveResume);

// Compare two resumes against each other
router.post("/compare", authenticate, compareResumes);

// Get progress history for a specific user
router.get("/progress/:userId", authenticate, getProgress);

// List all resumes uploaded by the logged-in user
router.get("/", authenticate, listResumes);

// Get a single resume by its ID
router.get("/:id", authenticate, getResume);

// Delete a resume by its ID
router.delete("/:id", authenticate, deleteResume);

// ─── Multer Error Handler ─────────────────────────────────────────────────────
// If multer rejects a file (wrong type, too large), this catches the error
// and returns a clean JSON response instead of crashing.

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }
    return res.status(400).json({
      success: false,
      message: "File upload error: " + err.message,
    });
  }

  if (err.message && err.message.includes("Only PDF")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
});

module.exports = router;
