import express from 'express';
import { connectDB, config } from './config/index.js';
import { configureMiddleware } from './middleware/index.js';
import { configureRoutes } from './routes/index.js';
import { HTTP_STATUS, sendError } from './utils/index.js';

// Connexion à la base de données
await connectDB();

const app = express();

// Configuration des middlewares
configureMiddleware(app);

// Configuration des routes
configureRoutes(app);

// Error handling middleware
app.use((err, req, res, next) => {
  sendError(res, err);
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route non trouvée'
  });
});

app.listen(config.app.port, () => {
  console.log(`Server is running in ${config.app.env} mode on port ${config.app.port}`);
});
