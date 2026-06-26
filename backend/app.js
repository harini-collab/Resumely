require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");

const authRoutes   = require("./routes/auth");
const resumeRoutes = require("./routes/resume");
const careerRoutes = require("./routes/career");
const { authenticate } = require("./middleware/auth");
const { listJobRoles } = require("./controllers/resumeController");
const { getDbStatus, requireDbConnection } = require("./config/database");

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(require("helmet")());

const defaultOrigins = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"];
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : defaultOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server and same-origin requests (no Origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin not allowed — ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many auth attempts." },
});

app.use("/api/", apiLimiter);
app.use("/api/auth", authLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    service: "Resumely — AI Career Intelligence Platform",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: getDbStatus(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",   requireDbConnection, authRoutes);
app.use("/api/resume", requireDbConnection, resumeRoutes);
app.use("/api/career", requireDbConnection, careerRoutes);

// Jobs reference endpoint
app.get("/api/jobs", requireDbConnection, authenticate, listJobRoles);

// ─── API Info ─────────────────────────────────────────────────────────────────
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Resumely API v2.0",
    endpoints: {
      auth: {
        signup:   "POST /api/auth/signup",
        login:    "POST /api/auth/login",
        me:       "GET  /api/auth/me",
        forgot:   "POST /api/auth/forgot-password",
        reset:    "POST /api/auth/reset-password/:token",
      },
      resume: {
        upload:   "POST   /api/resume/upload",
        analyze:  "POST   /api/resume/analyze",
        improve:  "POST   /api/resume/improve",
        compare:  "POST   /api/resume/compare",
        progress: "GET    /api/resume/progress/:userId",
        list:     "GET    /api/resume",
        get:      "GET    /api/resume/:id",
        delete:   "DELETE /api/resume/:id",
      },
      career: {
        jobMatch: "POST /api/career/job-match",
        insights: "GET  /api/career/insights",
      },
      jobs: "GET /api/jobs",
    },
  });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
