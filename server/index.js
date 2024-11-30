import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { configureMiddleware } from './middleware/index.js';
import { configureRoutes } from './routes/index.js';
import { config, connectDB, HTTP_STATUS, sendError } from './utils.js';
import { swaggerSpec } from './swagger.js';

const app = express();

// Configure middleware
configureMiddleware(app);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Configure routes
configureRoutes(app);

// 404 handler
app.use('*', (req, res) => {
  sendError(res, {
    statusCode: HTTP_STATUS.NOT_FOUND,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler caught:', error);
  sendError(res, error);
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(config.server.port, () => {
      console.log(`Server running on port ${config.server.port}`);
      console.log(`API documentation available at http://localhost:${config.server.port}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
