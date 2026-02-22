import "express-async-errors";
import express, { Express } from "express";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import { errorHandler } from "./middleware/errorHandler";
import { logActivity } from "./middleware/logger";
import swaggerSpec from "./config/swagger";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(logActivity);

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Chariot API Documentation</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
        <style>
          body {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <redoc spec-url='/swagger.json'></redoc>
        <script src="https://cdn.jsdelivr.net/npm/redoc@2.0.0-rc.77/bundles/redoc.standalone.js"> </script>
      </body>
    </html>
  `);
});
app.get("/swagger.json", (req, res) => {
  res.json(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use(errorHandler);

export default app;
