require("dotenv").config({ path: __dirname + "/.env" });
require("./config/dnsPatch");

const { validateEnv } = require("./config/env");
validateEnv();

const app = require("./app");
const connectDB = require("./config/database");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    try {
      await connectDB();
    } catch (error) {
      if (process.env.REQUIRE_DB_ON_START === "true") {
        throw error;
      }

      console.warn("Starting server without a database connection.");
      console.warn("Database-backed routes will return 503 until MongoDB is available.");
    }

    const server = app.listen(PORT, () => {
      console.log(`
Resumely - AI Career Intelligence Platform
Server running on port ${PORT}
Environment: ${process.env.NODE_ENV || "development"}
Health: http://localhost:${PORT}/health
      `);
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
