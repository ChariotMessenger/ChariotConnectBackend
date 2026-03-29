import { Router } from "express";
import { AdminController } from "../../controllers/admin/adminManagement.controller";
const router = Router();

/**
 * @swagger
 * /admins/roles:
 * post:
 * summary: Create a new administrative role
 * tags: [Admin Management]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [title, permissions]
 * properties:
 * title:
 * type: string
 * description:
 * type: string
 * permissions:
 * type: array
 * items:
 * type: string
 * example: ["EDIT_ADMIN", "APPROVE_USER"]
 * responses:
 * 201:
 * description: Role created successfully
 */
router.post("/roles", AdminController.handleCreateRole);

/**
 * @swagger
 * /admins/roles:
 * get:
 * summary: List all roles with pagination and search
 * tags: [Admin Management]
 * parameters:
 * - in: query
 * name: page
 * schema: { type: integer, default: 1 }
 * - in: query
 * name: limit
 * schema: { type: integer, default: 10 }
 * - in: query
 * name: search
 * schema: { type: string }
 * responses:
 * 200:
 * description: List of roles
 */
router.get("/roles", AdminController.handleGetRoles);

/**
 * @swagger
 * /admins:
 * post:
 * summary: Create a new admin and generate a temporary password
 * tags: [Admin Management]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [name, email, roleId]
 * properties:
 * name:
 * type: string
 * email:
 * type: string
 * roleId:
 * type: string
 * responses:
 * 201:
 * description: Admin created. Returns temporary password.
 */
router.post("/", AdminController.handleCreateAdmin);

/**
 * @swagger
 * /admins:
 * get:
 * summary: List all admins with filters and search
 * tags: [Admin Management]
 * parameters:
 * - in: query
 * name: page
 * schema: { type: integer, default: 1 }
 * - in: query
 * name: limit
 * schema: { type: integer, default: 10 }
 * - in: query
 * name: search
 * schema: { type: string }
 * - in: query
 * name: status
 * schema: { type: string, enum: [ACTIVE, SUSPENDED, INACTIVE] }
 * - in: query
 * name: roleId
 * schema: { type: string }
 * responses:
 * 200:
 * description: List of admins
 */
router.get("/", AdminController.handleGetAdmins);

/**
 * @swagger
 * /admins/roles/{id}:
 * patch:
 * summary: Update an existing role
 * tags: [Admin Management]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema: { type: string }
 * requestBody:
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * title: { type: string }
 * description: { type: string }
 * permissions: { type: array, items: { type: string } }
 * responses:
 * 200:
 * description: Role updated successfully
 */
router.patch("/roles/:id", AdminController.handleUpdateRole);

/**
 * @swagger
 * /admins/{id}:
 * patch:
 * summary: Update admin details (status, role, name)
 * tags: [Admin Management]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema: { type: string }
 * requestBody:
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * name: { type: string }
 * roleId: { type: string }
 * status: { type: string, enum: [ACTIVE, SUSPENDED, INACTIVE] }
 * responses:
 * 200:
 * description: Admin updated successfully
 */
router.patch("/:id", AdminController.handleUpdateAdmin);

export default router;
