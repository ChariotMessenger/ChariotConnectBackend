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

// Routes
import customerRoutes from "./routes/customer.routes";
import vendorRoutes from "./routes/vendor.routes";
import riderRoutes from "./routes/rider.routes";
import healthRoutes from "./routes/health.routes";
import orderRoutes from "./routes/order.routes";
import fakerRoutes from "./routes/faker.routes";

//Admin
import adminManagementRoutes from "./routes/admin/adminManagement.routes";
import adminAuthRoutes from "./routes/admin/adminAuth.routes";
import adminAnalyticsRoutes from "./routes/admin/adminAnalytics.routes";
import accountRoutes from "./routes/admin/admin.temp.routes";
import adminUserRoutes from "./routes/admin/admin.user.routes";

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
const allowedOrigins = [
  process.env.FRONTEND_URL ||
    "http://localhost:3000" ||
    "https://umali-admin.vercel.app",
  "http://localhost:19000", // Expo Go default
  "http://localhost:8081", // React Native default
  "capacitor://localhost", // Capacitor iOS
  "http://localhost", // Capacitor Android
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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
app.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Chariot Connect API Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0;">
        <div id="redoc-container"></div>
        <script src="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js"></script>
        <script>
          Redoc.init('/swagger.json', {}, document.getElementById('redoc-container'))
        </script>
      </body>
    </html>
  `);
});

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
app.use(`${apiPrefix}/orders`, orderRoutes);
app.use(`${apiPrefix}/dev`, fakerRoutes);

//Admin
app.use(`${apiPrefix}/admins`, adminManagementRoutes);
app.use(`${apiPrefix}/admin/auth`, adminAuthRoutes);
app.use(`${apiPrefix}/admin`, adminAnalyticsRoutes);
app.use(`${apiPrefix}/admin/accounts`, accountRoutes);
app.use(`${apiPrefix}/admin`, adminUserRoutes);

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
