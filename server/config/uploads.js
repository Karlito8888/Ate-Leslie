import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export const uploadsConfig = {
  dir: process.env.UPLOADS_DIR || "uploads",
  
  image: {
    uploadDir: process.env.IMAGE_UPLOAD_DIR || "uploads/images",
    thumbnailSizes: {
      small: 100,
      medium: 300,
      large: 600,
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ["jpeg", "png", "webp"],
    maxDimension: 5000,
  },
};
