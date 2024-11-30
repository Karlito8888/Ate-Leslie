import dotenv from 'dotenv';
import connectDB from '../config/database.js';
import User from '../models/user.model.js';

// Charger les variables d'environnement
dotenv.config();

const admins = [
  {
    username: 'admin1',
    email: 'admin1@ateleslie.com',
    password: 'Admin123!',
    role: 'admin'
  },
  {
    username: 'admin2',
    email: 'admin2@ateleslie.com',
    password: 'Admin123!',
    role: 'admin'
  },
  {
    username: 'admin3',
    email: 'admin3@ateleslie.com',
    password: 'Admin123!',
    role: 'admin'
  }
];

const createAdmins = async () => {
  try {
    // Connexion à la base de données
    await connectDB();

    // Créer les admins
    for (const admin of admins) {
      const existingUser = await User.findOne({ email: admin.email });
      
      if (!existingUser) {
        await User.create(admin);
        console.log(`Admin créé : ${admin.email}`);
      } else {
        console.log(`Admin existe déjà : ${admin.email}`);
      }
    }

    console.log('Création des admins terminée !');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de la création des admins:', error);
    process.exit(1);
  }
};

createAdmins();
