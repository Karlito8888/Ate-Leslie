import mongoose from 'mongoose';

// Fonction de connexion à la base de données
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('La variable d\'environnement MONGODB_URI n\'est pas définie');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
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
    // Ne pas quitter le processus, permettre au serveur de fonctionner même sans DB
    // process.exit(1);
  }
};

export default connectDB;
