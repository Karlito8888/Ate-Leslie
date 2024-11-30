import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { HTTP_STATUS, ApiError, validate } from '../utils/index.js';
import User from '../models/user.model.js';

// Charger les variables d'environnement
config();

const defaultAdmins = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!',
    role: 'admin'
  }
];

const seedDatabase = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(config.dbUrl);
    console.log('Connected to database');

    // Create default admin if none exists
    for (const adminData of defaultAdmins) {
      const { username, email, password, role } = adminData;

      // Valider les données
      const usernameValidation = validate.username(username);
      if (!usernameValidation.isValid) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, usernameValidation.message);
      }

      const emailValidation = validate.email(email);
      if (!emailValidation.isValid) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, emailValidation.message);
      }

      const passwordValidation = validate.password(password);
      if (!passwordValidation.isValid) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, passwordValidation.message);
      }

      // Vérifier si l'admin existe déjà
      const existingAdmin = await User.findOne({ $or: [{ email }, { username }] });
      
      if (existingAdmin) {
        console.log(`Admin ${username} already exists`);
        continue;
      }

      // Créer l'admin
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await User.create({
        username,
        email,
        password: hashedPassword,
        role
      });

      console.log(`Admin ${username} created successfully`);
    }

    console.log('Database seeding completed');
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Add command line arguments handling
const args = process.argv.slice(2);
if (args.includes('--force')) {
  // Force reset admins if --force flag is used
  User.deleteMany({ role: 'admin' })
    .then(() => {
      console.log('Existing admin accounts deleted');
      seedDatabase();
    })
    .catch(error => {
      console.error('Error deleting admin accounts:', error.message);
      process.exit(1);
    });
} else {
  seedDatabase();
}
