import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const databaseConfig = {
  uri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ateleslie",
  options: {},
};
