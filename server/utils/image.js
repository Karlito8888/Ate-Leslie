import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/index.js';
import { ApiError } from './error.js';
import { HTTP_STATUS } from '../constants/http.js';

export const imageService = {
  // Validation des fichiers images
  validateImageFile(file) {
    if (!file) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'No file uploaded');
    }

    const fileExtension = path.extname(file.originalname).slice(1).toLowerCase();
    
    if (!config.uploads.image.allowedFormats.includes(fileExtension)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid file format');
    }

    if (file.size > config.uploads.image.maxSize) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'File too large');
    }
  },

  // Traitement de l'image
  async processImage(file) {
    try {
      this.validateImageFile(file);

      return {
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype
      };
    } catch (error) {
      if (file && file.path) {
        await this.deleteImage(file);
      }
      throw new ApiError(
        error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        error.message || 'Error processing image'
      );
    }
  },

  // Suppression de l'image
  async deleteImage(file) {
    try {
      if (file && file.path) {
        await fs.unlink(file.path);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  },

  // Génération de miniatures
  generateThumbnails: async (imagePath, sizes = ['small', 'medium', 'large']) => {
    // TODO: Implémenter la génération de miniatures
    // Utiliser une bibliothèque comme Sharp pour redimensionner les images
    return {};
  }
};
