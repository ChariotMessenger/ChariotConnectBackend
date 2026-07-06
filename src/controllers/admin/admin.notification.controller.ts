import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
import { adminNotificationService } from "../../services/admin/admin.notifications.service";

export const handleCreateDirectNotification = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { userId, userRole, title, body, clickableLinks, iconUrl } = req.body;

    const notification = await adminNotificationService.createNotification({
      userId,
      userRole,
      title,
      body,
      clickableLinks,
      iconUrl,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create direct notification",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleBroadcastNotification = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { target, title, body, clickableLinks, iconUrl } = req.body;

    const result = await adminNotificationService.broadcastNotification({
      target,
      title,
      body,
      clickableLinks,
      iconUrl,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to broadcast notification",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleGetAllNotifications = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await adminNotificationService.getAllNotifications(
      limit,
      offset,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch global notifications history",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
