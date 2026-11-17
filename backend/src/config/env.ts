import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT || 5001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid port number");
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters");
}

export const env = {
  port,
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret,
};
