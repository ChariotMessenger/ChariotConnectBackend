const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Chariot Backend API",
    version: "1.0.0",
    description: "Chariot-Connect Backend API",
    contact: {
      name: "Chariot Support",
      email: "support@chariot.com",
    },
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Development server",
    },
    {
      url: "https://chariot-web-api.onrender.com",
      description: "Production server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token for authentication",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN", "STAFF"] },
          twoFactorEnabled: { type: "boolean" },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE", "SUSPENDED"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },

      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
          code: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        summary: "Register new user account",
        description: "Create a new user account with email and password",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "user@example.com",
                  },
                  password: {
                    type: "string",
                    minLength: 8,
                    example: "SecurePass123!",
                  },
                  firstName: { type: "string", example: "John" },
                  lastName: { type: "string", example: "Doe" },
                },
                required: ["email", "password", "firstName", "lastName"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "400": { description: "Validation error or email already exists" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Login user",
        description: "Authenticate user and return JWT token",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "user@example.com",
                  },
                  password: { type: "string", example: "SecurePass123!" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful, returns JWT token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    user: { $ref: "#/components/schemas/User" },
                    requiresOtp: { type: "boolean" },
                  },
                },
              },
            },
          },
          "401": { description: "Invalid credentials" },
          "403": { description: "Account suspended or inactive" },
        },
      },
    },
    "/api/auth/verify-otp": {
      post: {
        summary: "Verify OTP for 2FA",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  otp: { type: "string", pattern: "^[0-9]{6}$" },
                },
                required: ["email", "otp"],
              },
            },
          },
        },
        responses: {
          "200": { description: "OTP verified, returns JWT token" },
          "401": { description: "Invalid or expired OTP" },
        },
      },
    },
    "/api/auth/change-password": {
      post: {
        summary: "Change user password",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  currentPassword: { type: "string" },
                  newPassword: { type: "string", minLength: 8 },
                },
                required: ["currentPassword", "newPassword"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Password changed successfully" },
          "401": { description: "Current password is incorrect" },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        summary: "Request password reset",
        description:
          "Send password reset link to email (no authentication required)",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "user@example.com",
                  },
                },
                required: ["email"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Password reset link sent to email",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "404": { description: "User not found" },
        },
      },
    },
    "/api/auth/verify-password-reset-otp": {
      post: {
        summary: "Verify OTP for password reset",
        description: "Verify the 6-digit code sent during password reset",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "user@example.com",
                  },
                  otp: {
                    type: "string",
                    pattern: "^[0-9]{6}$",
                    example: "123456",
                  },
                },
                required: ["email", "otp"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP verified successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    otpId: { type: "string" },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid or expired OTP" },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        summary: "Reset password with OTP",
        description:
          "Reset password using the OTP and new password (no authentication required)",
        tags: ["Authentication"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "user@example.com",
                  },
                  otp: {
                    type: "string",
                    pattern: "^[0-9]{6}$",
                    example: "123456",
                  },
                  newPassword: {
                    type: "string",
                    minLength: 8,
                    example: "NewSecurePass123!",
                  },
                },
                required: ["email", "otp", "newPassword"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Password reset successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid, expired, or already used OTP" },
        },
      },
    },

    "/api/users": {
      get: {
        summary: "List all users",
        tags: ["Users"],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10 },
          },
        ],
        responses: {
          "200": {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/search": {
      get: {
        summary: "Search users",
        tags: ["Users"],
        parameters: [
          {
            name: "query",
            in: "query",
            schema: { type: "string" },
            description: "Search by name or email",
          },
        ],
        responses: {
          "200": { description: "Search results" },
        },
      },
    },
    "/api/users/{id}": {
      get: {
        summary: "Get user by ID",
        tags: ["Users"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "User details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "404": { description: "User not found" },
        },
      },
      put: {
        summary: "Update user",
        tags: ["Users"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  email: { type: "string", format: "email" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "User updated" },
          "404": { description: "User not found" },
        },
      },
      delete: {
        summary: "Delete user",
        tags: ["Users"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "User deleted" },
          "404": { description: "User not found" },
        },
      },
    },
    "/api/users/{id}/status": {
      patch: {
        summary: "Update user status",
        tags: ["Users"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
                  },
                },
                required: ["status"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Status updated" },
        },
      },
    },
    "/api/users/{id}/reset-password": {
      patch: {
        summary: "Reset user password",
        tags: ["Users"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Password reset email sent" },
        },
      },
    },
    "/api/users/{id}/activity-logs": {
      get: {
        summary: "Get user activity logs",
        tags: ["Users"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "User activity logs" },
        },
      },
    },
  },
};

export default swaggerSpec;
