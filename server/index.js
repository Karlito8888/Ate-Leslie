import express from "express";
import swaggerUi from "swagger-ui-express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { configureMiddleware } from "./middleware/index.js";
import { configureRoutes } from "./routes/index.js";
import { config } from "./config/index.js";
import { connectDB, responseHelpers } from "./utils/index.js";
import { HTTP_STATUS } from "./constants/http.js";
import { swaggerSpec } from "./swagger.js";

const app = express();

// Start server
const startServer = async () => {
  try {
    // Configure middleware (async)
    await configureMiddleware(app);

    // Swagger documentation
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Configure routes
    configureRoutes(app);

    // 404 handler
    app.use("*", (req, res) => {
      responseHelpers.sendError(res, {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: `Route ${req.originalUrl} not found`,
      });
    });

    // Global error handler
    app.use((error, req, res, next) => {
      console.error("Global error handler caught:", error);
      responseHelpers.sendError(res, error);
    });

    // Connect to database and start listening
    await connectDB();
    if (process.env.NODE_ENV !== "test") {
      app.listen(config.server.port, () => {
        console.log(`Server running on port ${config.server.port}`);
        console.log(
          `API documentation available at http://localhost:${config.server.port}/api-docs`
        );
      });
    }
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
};

startServer();

export { app };
