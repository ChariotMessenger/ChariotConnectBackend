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
    // Explicitly define tags to prevent the "name" reading error
    tags: [
      { name: "Admin", description: "Admin dashboard and analytics" },
      { name: "Admin Auth", description: "Authentication for administrators" },
      {
        name: "Admin Management",
        description: "Roles and Admin user management",
      },
      { name: "Orders", description: "Order management and payments" },
      { name: "Customers", description: "Customer account operations" },
      { name: "Vendors", description: "Vendor account operations" },
      { name: "Riders", description: "Rider account operations" },
    ],
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Development server",
      },
      {
        url: "https://chariotconnectbackend.onrender.com/api/v1",
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
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
            code: { type: "string", example: "ERROR_CODE" },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success message" },
            data: { type: "object" },
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
  // Ensure we look deep into subfolders
  apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts"],
};
