import express, { Express, Request, Response, NextFunction } from "express";
import "express-async-errors";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

// Middleware
import { errorHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/requestLogger";
import { authMiddleware } from "./middlewares/auth";

// Routes
import customerRoutes from "./routes/customer.routes";
import vendorRoutes from "./routes/vendor.routes";
import riderRoutes from "./routes/rider.routes";
import healthRoutes from "./routes/health.routes";

// Config
import { swaggerOptions } from "./config/swagger";
import { logger } from "./utils/logger";

const app: Express = express();

// Swagger Setup
const swaggerSpec = swaggerJsDoc(swaggerOptions);

// ==================== Middleware ====================

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Logging
app.use(morgan("combined"));
app.use(requestLogger);

// ==================== Documentation ====================
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
    },
  }),
);

// ==================== Health Check ====================
app.use("/health", healthRoutes);

// ==================== API Routes ====================

const apiVersion = process.env.API_VERSION || "v1";
const apiPrefix = `/api/${apiVersion}`;

app.use(`${apiPrefix}/customers`, customerRoutes);
app.use(`${apiPrefix}/vendors`, vendorRoutes);
app.use(`${apiPrefix}/riders`, riderRoutes);

// ==================== 404 Handler ====================
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  logger.warn(`404: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ==================== Error Handler (Must be last) ====================
app.use(errorHandler);

export default app;
