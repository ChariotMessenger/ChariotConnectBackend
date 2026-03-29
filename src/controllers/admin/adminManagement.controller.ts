import { Request, Response } from "express";
import { AdminService } from "../../services/admin/adminManagement.service";

const adminService = new AdminService();

export class AdminController {
  static async handleCreateRole(req: Request, res: Response) {
    try {
      const role = await adminService.createRole(req.body);
      return res.status(201).json({ success: true, data: role });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async handleCreateAdmin(req: Request, res: Response) {
    try {
      const result = await adminService.createAdmin(req.body);
      return res.status(201).json({
        success: true,
        message:
          "Admin created successfully. Please share the temporary password.",
        data: result.admin,
        credentials: { password: result.tempPassword },
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async handleGetAdmins(req: Request, res: Response) {
    try {
      const result = await adminService.getAllAdmins(req.query);
      return res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async handleGetRoles(req: Request, res: Response) {
    try {
      const result = await adminService.getAllRoles(req.query);
      return res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async handleUpdateRole(req: Request, res: Response) {
    try {
      const role = await adminService.updateRole(req.params.id, req.body);
      return res.status(200).json({ success: true, data: role });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async handleUpdateAdmin(req: Request, res: Response) {
    try {
      const admin = await adminService.updateAdmin(req.params.id, req.body);
      return res.status(200).json({ success: true, data: admin });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
