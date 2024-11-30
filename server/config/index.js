import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuration initiale
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration centralisée
export const config = {
  app: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    uploadsDir: join(__dirname, '../public/uploads')
  },
  client: {
    url: process.env.CLIENT_URL || 'http://localhost:5173'
  },
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ateleslie',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '24h'
  },
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  },
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    fromName: process.env.EMAIL_FROM_NAME || 'Ate Leslie',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@ateleslie.com'
  },
  passwordReset: {
    tokenExpiresIn: 3600000, // 1 hour in milliseconds
  }
};

// Fonction de connexion à la base de données avec gestion des événements
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.db.uri, config.db.options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Gestion des événements de connexion
    mongoose.connection.on('error', err => {
      console.error('Erreur MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('Déconnecté de MongoDB');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error(`Erreur de connexion MongoDB: ${error.message}`);
    if (config.app.env === 'production') {
      process.exit(1);
    }
  }
};

export default {
  config,
  connectDB
};
