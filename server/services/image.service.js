import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';

const THUMBNAIL_SIZES = {
  small: 100,
  medium: 300,
  large: 600
};

export const imageService = {
  /**
   * Redimensionne une image et crée différentes tailles de vignettes
   * @param {Object} file - Fichier uploadé via multer
   * @returns {Promise<Object>} - Informations sur l'image originale et ses vignettes
   */
  async processImage(file) {
    const originalDir = 'uploads/events/original';
    const thumbnailsDir = 'uploads/events/thumbnails';
    
    // Créer les dossiers s'ils n'existent pas
    await fs.mkdir(originalDir, { recursive: true });
    await fs.mkdir(thumbnailsDir, { recursive: true });

    // Lire les métadonnées de l'image originale
    const metadata = await sharp(file.path).metadata();
    const originalWidth = metadata.width;

    // Déplacer l'image originale
    const originalFilename = `original_${file.filename}`;
    const originalPath = path.join(originalDir, originalFilename);
    await fs.rename(file.path, originalPath);

    // Créer l'objet pour stocker les informations de l'image
    const imageInfo = {
      original: {
        filename: originalFilename,
        path: originalPath,
        width: metadata.width,
        height: metadata.height
      },
      thumbnails: {}
    };

    // Créer les vignettes seulement pour les tailles inférieures à l'original
    for (const [size, targetWidth] of Object.entries(THUMBNAIL_SIZES)) {
      // Ne créer la vignette que si la largeur cible est inférieure à l'original
      if (targetWidth < originalWidth) {
        const thumbnailFilename = `${size}_${file.filename}`;
        const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

        // Calculer la hauteur proportionnelle
        const height = Math.round((targetWidth * metadata.height) / metadata.width);

        // Redimensionner l'image
        await sharp(originalPath)
          .resize(targetWidth, height, {
            fit: 'contain',
            withoutEnlargement: true
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);

        // Stocker les informations de la vignette
        imageInfo.thumbnails[size] = {
          filename: thumbnailFilename,
          path: thumbnailPath,
          width: targetWidth,
          height
        };
      } else {
        // Si la taille cible est plus grande que l'original, 
        // utiliser l'original pour cette taille
        imageInfo.thumbnails[size] = {
          filename: originalFilename,
          path: originalPath,
          width: originalWidth,
          height: metadata.height
        };
      }
    }

    return imageInfo;
  },

  /**
   * Supprime une image et toutes ses vignettes
   * @param {Object} imageInfo - Informations sur l'image à supprimer
   */
  async deleteImage(imageInfo) {
    const pathsToDelete = new Set();

    // Ajouter le chemin de l'original
    if (imageInfo.original?.path) {
      pathsToDelete.add(imageInfo.original.path);
    }

    // Ajouter les chemins des vignettes (éviter les doublons)
    if (imageInfo.thumbnails) {
      for (const thumbnail of Object.values(imageInfo.thumbnails)) {
        if (thumbnail?.path) {
          pathsToDelete.add(thumbnail.path);
        }
      }
    }

    // Supprimer tous les fichiers uniques
    for (const path of pathsToDelete) {
      await fs.unlink(path).catch(() => {});
    }
  }
};
