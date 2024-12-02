import dotenv from "dotenv";
import crypto from "crypto";

// Load environment variables
dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString("hex"),
  expiresIn: process.env.JWT_EXPIRES_IN || "24h",
};
