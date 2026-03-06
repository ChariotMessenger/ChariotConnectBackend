import { Options } from "swagger-jsdoc";

export const swaggerOptions: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chariot Connect API",
      version: "1.0.0",
      description:
        "Multi-platform backend API for Chariot Connect - Vendor, Customer, and Rider management",
      contact: {
        name: "Chariot Connect Team",
        email: "support@chariotconnect.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Development server",
      },
      {
        url: "https://chariot-web-api.onrender.com/api/v1",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Bearer token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
            code: {
              type: "string",
              example: "ERROR_CODE",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Success message",
            },
            data: {
              type: "object",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};
