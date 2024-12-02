import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { HTTP_STATUS } from '../../constants/http.js';
import { ApiError } from '../../utils/index.js';
import { config } from '../../config/index.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploads.image.uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Convertir le mimetype en format (ex: 'image/jpeg' -> 'jpeg')
  const format = file.mimetype.split('/')[1];
  
  if (config.uploads.image.allowedFormats.includes(format)) {
    cb(null, true);
  } else {
    cb(new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      'Invalid file type. Only JPEG, PNG and WebP images are allowed.'
    ), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.uploads.image.maxSize
  }
});
