import path from 'path';
import { promises as fs } from 'fs';
import sharp from 'sharp';
import { imageService } from '../../services/image.service.js';
import { generateTestImage, cleanupTestImages } from '../helpers/imageGenerator.js';

describe('Image Service Test', () => {
  const TEST_UPLOAD_DIR = 'uploads/test';
  const TEST_ORIGINAL_DIR = path.join(TEST_UPLOAD_DIR, 'original');
  const TEST_THUMBNAILS_DIR = path.join(TEST_UPLOAD_DIR, 'thumbnails');

  beforeAll(async () => {
    // Créer les dossiers de test
    await fs.mkdir(TEST_ORIGINAL_DIR, { recursive: true });
    await fs.mkdir(TEST_THUMBNAILS_DIR, { recursive: true });
  });

  afterAll(async () => {
    // Nettoyer les dossiers de test
    await cleanupTestImages(TEST_UPLOAD_DIR);
  });

  afterEach(async () => {
    // Nettoyer les images après chaque test
    await cleanupTestImages(TEST_ORIGINAL_DIR);
    await cleanupTestImages(TEST_THUMBNAILS_DIR);
  });

  // Test 1: Traitement d'une grande image
  it('should process large image and create all thumbnails', async () => {
    // Générer une grande image de test (1000x750)
    const testImagePath = path.join(TEST_UPLOAD_DIR, 'large_test.jpg');
    const testFile = await generateTestImage(1000, 750, testImagePath);

    // Traiter l'image
    const result = await imageService.processImage(testFile);

    // Vérifier l'image originale
    expect(result.original).toBeDefined();
    expect(result.original.width).toBe(1000);
    expect(result.original.height).toBe(750);

    // Vérifier les vignettes
    expect(result.thumbnails.small).toBeDefined();
    expect(result.thumbnails.small.width).toBe(100);
    expect(result.thumbnails.medium).toBeDefined();
    expect(result.thumbnails.medium.width).toBe(300);
    expect(result.thumbnails.large).toBeDefined();
    expect(result.thumbnails.large.width).toBe(600);

    // Vérifier que les fichiers existent
    expect(await fs.access(result.original.path).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(result.thumbnails.small.path).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(result.thumbnails.medium.path).then(() => true).catch(() => false)).toBe(true);
    expect(await fs.access(result.thumbnails.large.path).then(() => true).catch(() => false)).toBe(true);
  });

  // Test 2: Traitement d'une petite image
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

  // Test 3: Suppression d'images
  it('should delete all image files correctly', async () => {
    // Générer et traiter une image
    const testImagePath = path.join(TEST_UPLOAD_DIR, 'delete_test.jpg');
    const testFile = await generateTestImage(1000, 750, testImagePath);
    const result = await imageService.processImage(testFile);

    // Supprimer les images
    await imageService.deleteImage(result);

    // Vérifier que tous les fichiers ont été supprimés
    expect(await fs.access(result.original.path).then(() => true).catch(() => false)).toBe(false);
    expect(await fs.access(result.thumbnails.small.path).then(() => true).catch(() => false)).toBe(false);
    expect(await fs.access(result.thumbnails.medium.path).then(() => true).catch(() => false)).toBe(false);
    expect(await fs.access(result.thumbnails.large.path).then(() => true).catch(() => false)).toBe(false);
  });

  // Test 4: Vérification des proportions
  it('should maintain aspect ratio for all thumbnails', async () => {
    // Générer une image avec des proportions spécifiques (800x400)
    const testImagePath = path.join(TEST_UPLOAD_DIR, 'aspect_test.jpg');
    const testFile = await generateTestImage(800, 400, testImagePath);

    // Traiter l'image
    const result = await imageService.processImage(testFile);

    // Vérifier les proportions de chaque vignette
    const originalRatio = 800 / 400; // 2:1

    const smallRatio = result.thumbnails.small.width / result.thumbnails.small.height;
    const mediumRatio = result.thumbnails.medium.width / result.thumbnails.medium.height;
    const largeRatio = result.thumbnails.large.width / result.thumbnails.large.height;

    // Permettre une petite marge d'erreur due aux arrondis
    expect(Math.abs(smallRatio - originalRatio)).toBeLessThan(0.1);
    expect(Math.abs(mediumRatio - originalRatio)).toBeLessThan(0.1);
    expect(Math.abs(largeRatio - originalRatio)).toBeLessThan(0.1);
  });
});
