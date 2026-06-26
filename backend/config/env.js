const REQUIRED_IN_PRODUCTION = [
  "MONGODB_URI",
  "JWT_SECRET",
  "ALLOWED_ORIGINS",
  "FRONTEND_URL",
];

const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const missing = [];

  if (isProduction) {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!process.env[key]?.trim()) {
        missing.push(key);
      }
    }
  }

  if (missing.length) {
    console.error("Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error("Copy backend/.env.example to backend/.env and fill in values.");
    process.exit(1);
  }

  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (jwtSecret && jwtSecret.length < 32) {
    console.error("JWT_SECRET must be at least 32 characters.");
    process.exit(1);
  }

  if (isProduction && !process.env.OPENAI_API_KEY?.trim()) {
    console.warn("OPENAI_API_KEY is not set — AI resume features will be disabled.");
  }
};

module.exports = { validateEnv };
