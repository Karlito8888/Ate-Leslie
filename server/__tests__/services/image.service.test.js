import { jest, describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import path from 'path';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import { imageService, config } from '../../utils.js';
import { generateTestImage, cleanupTestImages } from '../helpers/imageGenerator.js';
import { ApiError, HTTP_STATUS } from '../../utils.js';

describe('Image Service Test', () => {
  const TEST_UPLOAD_DIR = 'uploads/test';
  const TEST_ORIGINAL_DIR = path.join(TEST_UPLOAD_DIR, 'original');
  const TEST_THUMBNAILS_DIR = path.join(TEST_UPLOAD_DIR, 'thumbnails');

  beforeAll(async () => {
    await fs.mkdir(TEST_ORIGINAL_DIR, { recursive: true });
    await fs.mkdir(TEST_THUMBNAILS_DIR, { recursive: true });
  });

  afterAll(async () => {
    await cleanupTestImages(TEST_UPLOAD_DIR);
  });

  afterEach(async () => {
    await cleanupTestImages(TEST_ORIGINAL_DIR);
    await cleanupTestImages(TEST_THUMBNAILS_DIR);
    jest.restoreAllMocks();
  });

  // Tests fonctionnels
  describe('Functional Tests', () => {
    it('should process large image and create all thumbnails', async () => {
      // Générer une grande image de test (1000x750)
      const testImagePath = path.join(TEST_UPLOAD_DIR, 'large_test.jpg');
      const testFile = await generateTestImage(1000, 750, testImagePath);

      // Traiter l'image
      const result = await imageService.processImage(testFile);

      // Vérifier l'image originale
      expect(result.original.width).toBe(1000);
      expect(result.original.height).toBe(750);

      // Vérifier les vignettes
      expect(result.thumbnails.small.width).toBe(100);
      expect(result.thumbnails.medium.width).toBe(300);
      expect(result.thumbnails.large.width).toBe(600);
    });

    it('should handle small images correctly', async () => {
      // Générer une petite image de test (250x188)
      const testImagePath = path.join(TEST_UPLOAD_DIR, 'small_test.jpg');
      const testFile = await generateTestImage(250, 188, testImagePath);

      // Traiter l'image
      const result = await imageService.processImage(testFile);

      // Vérifier l'image originale
      expect(result.original.width).toBe(250);

      // Vérifier que seule la petite vignette est créée
      expect(result.thumbnails.small.width).toBe(100);
      
      // Vérifier que les autres vignettes pointent vers l'original
      expect(result.thumbnails.medium.path).toBe(result.original.path);
      expect(result.thumbnails.large.path).toBe(result.original.path);
    });

    it('should delete all image files correctly', async () => {
      // Générer et traiter une image
      const testImagePath = path.join(TEST_UPLOAD_DIR, 'delete_test.jpg');
      const testFile = await generateTestImage(800, 600, testImagePath);
      const result = await imageService.processImage(testFile);

      // Supprimer les fichiers
      await imageService.deleteImage(result);

      // Vérifier que les fichiers n'existent plus
      for (const size of Object.keys(result.thumbnails)) {
        const exists = await fs.access(result.thumbnails[size].path)
          .then(() => true)
          .catch(() => false);
        expect(exists).toBe(false);
      }
    });

    it('should maintain aspect ratio for all thumbnails', async () => {
      // Générer une image avec un ratio d'aspect spécifique (16:9)
      const testImagePath = path.join(TEST_UPLOAD_DIR, 'aspect_test.jpg');
      const testFile = await generateTestImage(1600, 900, testImagePath);

      // Traiter l'image
      const result = await imageService.processImage(testFile);

      // Vérifier le ratio d'aspect des vignettes
      const originalRatio = 1600 / 900;
      for (const size of Object.keys(result.thumbnails)) {
        const thumbnail = result.thumbnails[size];
        if (thumbnail.path !== result.original.path) {
          const ratio = thumbnail.width / thumbnail.height;
          expect(Math.abs(ratio - originalRatio)).toBeLessThan(0.1);
        }
      }
    });
  });

  // Tests de validation et gestion des erreurs
  describe('Validation and Error Handling', () => {
    it('should reject missing files', async () => {
      await expect(imageService.validateImage(null))
        .rejects
        .toThrow('No file provided');
    });

    it('should reject files that are too large', async () => {
      // Créer une image qui dépasse la limite
      const testImagePath = path.join(TEST_UPLOAD_DIR, 'large_test.jpg');
      const testFile = await generateTestImage(1000, 1000, testImagePath);
      
      // Simuler un fichier trop grand en modifiant la config temporairement
      const originalMaxSize = config.image.maxSize;
      config.image.maxSize = 1024; // 1KB
      
      try {
        await expect(imageService.validateImage(testFile))
          .rejects
          .toThrow('File too large');
      } finally {
        config.image.maxSize = originalMaxSize;
      }
    });

    it('should reject images with invalid dimensions', async () => {
      const testImagePath = path.join(TEST_UPLOAD_DIR, 'huge_test.jpg');
      const testFile = await generateTestImage(6000, 6000, testImagePath);
      
      await expect(imageService.validateImage(testFile))
        .rejects
        .toThrow('Image dimensions too large');
    });

    it('should clean up files if thumbnail generation fails', async () => {
      // Créer une image de test
      const testImagePath = path.join(TEST_UPLOAD_DIR, 'cleanup_test.jpg');
      const testFile = await generateTestImage(1000, 1000, testImagePath);
      
      // Mock sharp pour simuler une erreur
      const mockMetadata = jest.spyOn(sharp.prototype, 'metadata')
        .mockResolvedValue({ width: 1000, height: 1000, format: 'jpeg' });
        
      const mockResize = jest.spyOn(sharp.prototype, 'resize')
        .mockImplementation(() => {
          throw new Error('Simulated error');
        });
      
      try {
        await expect(imageService.processImage(testFile))
          .rejects
          .toThrow('Simulated error');
          
        // Vérifier que les fichiers ont été nettoyés
        const files = await fs.readdir(TEST_THUMBNAILS_DIR);
        expect(files.length).toBe(0);
      } finally {
        mockMetadata.mockRestore();
        mockResize.mockRestore();
      }
    });

    it('should handle concurrent file processing', async () => {
      // Créer plusieurs images de test
      const testFiles = await Promise.all([
        generateTestImage(800, 600, path.join(TEST_UPLOAD_DIR, 'concurrent1.jpg')),
        generateTestImage(800, 600, path.join(TEST_UPLOAD_DIR, 'concurrent2.jpg')),
        generateTestImage(800, 600, path.join(TEST_UPLOAD_DIR, 'concurrent3.jpg'))
      ]);
      
      // Traiter les images en parallèle
      const results = await Promise.all(
        testFiles.map(file => imageService.processImage(file))
      );
      
      // Vérifier que chaque image a ses vignettes
      for (const result of results) {
        expect(result.thumbnails.small).toBeDefined();
        expect(result.thumbnails.medium).toBeDefined();
        expect(result.thumbnails.large).toBeDefined();
      }
    });
  });
});
