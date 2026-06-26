const mongoose = require("mongoose");
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectionOptions = {
  family: 4,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
};

const registerConnectionEvents = () => {
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting to reconnect...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected successfully");
  });
};

const connectWithFallback = async ({ label, uri }) => {
  const conn = await mongoose.connect(uri, connectionOptions);
  console.log(`MongoDB connected (${label}): ${conn.connection.host}`);
  registerConnectionEvents();
};

const isDbConnected = () => mongoose.connection.readyState === 1;

const getDbStatus = () => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    state: states[mongoose.connection.readyState] || "unknown",
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  };
};

const requireDbConnection = (req, res, next) => {
  if (isDbConnected()) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message: "Database is not connected. Check MONGODB_URI or start local MongoDB.",
    database: getDbStatus(),
  });
};

// Tries MONGODB_URI first. In development, falls back to local MongoDB when Atlas
// is unreachable (e.g. network blocks port 27017). Production uses Atlas only.
const connectDB = async () => {
  const connections = [{ label: "Atlas", uri: process.env.MONGODB_URI }];

  if (process.env.NODE_ENV !== "production") {
    connections.push({
      label: "local fallback",
      uri: process.env.MONGODB_FALLBACK_URI || "mongodb://127.0.0.1:27017/resumely",
    });
  }

  const targets = connections.filter((connection) => connection.uri);

  let lastError;

  for (const connection of targets) {
    try {
      await connectWithFallback(connection);
      return;
    } catch (error) {
      lastError = error;
      console.error(`Failed to connect to ${connection.label}: ${error.message}`);
      await mongoose.disconnect().catch(() => {});
    }
  }

  console.error("Failed to connect to MongoDB:", lastError?.message);
  console.error("Check MONGODB_URI or start local MongoDB.");
  throw lastError || new Error("MongoDB connection failed");
};

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;
module.exports.isDbConnected = isDbConnected;
module.exports.requireDbConnection = requireDbConnection;
