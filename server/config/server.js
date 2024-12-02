import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const serverConfig = {
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || "development",
};
