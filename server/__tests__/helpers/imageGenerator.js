import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';

export const generateTestImage = async (width, height, outputPath) => {
  // Créer une image de test avec une couleur de fond et du texte
  const svg = `
    <svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="24" 
            text-anchor="middle" dy=".3em" fill="#333">
        ${width}x${height}
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .jpeg()
    .toFile(outputPath);

  // Créer un objet similaire à ce que multer produirait
  return {
    fieldname: 'image',
    originalname: path.basename(outputPath),
    encoding: '7bit',
    mimetype: 'image/jpeg',
    destination: path.dirname(outputPath),
    filename: path.basename(outputPath),
    path: outputPath,
    size: (await fs.stat(outputPath)).size
  };
};

export const cleanupTestImages = async (directory) => {
  try {
    await fs.rm(directory, { recursive: true, force: true });
  } catch (error) {
    // Ignorer les erreurs si le dossier n'existe pas
  }
};