// Point d'entrée du serveur Express
import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import { configureMiddleware } from './middleware/index.js';
import { configureRoutes } from './routes/index.js';
import { handleError } from './utils/helpers/errorHandler.js';
import { HTTP_STATUS } from './utils/constants/index.js';

// Configuration des variables d'environnement
dotenv.config();

// Connexion à la base de données
await connectDB();

const app = express();

// Configuration des middlewares
configureMiddleware(app);

// Configuration des routes
configureRoutes(app);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  handleError(err, res);
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route non trouvée'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
