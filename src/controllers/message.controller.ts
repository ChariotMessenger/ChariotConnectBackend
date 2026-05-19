import { Response } from "express";
import { AuthRequest } from "../types";
import { messageService } from "../services/message.service";
import { reviewService } from "../services/review-favorite.service";
import { logger } from "../utils/logger";

export class MessageController {
  static async sendMessage(req: AuthRequest, res: Response) {
    try {
      const { roomId, recipientId, senderType, content, sentByAi } = req.body;

      const message = await messageService.createMessage({
        roomId,
        recipientId,
        senderId: req.user!.id,
        senderType,
        content,
        sentByAi,
      });

      const io = (req.app as any).io;
      if (io) {
        io.to(`room:${message.roomId}`).emit("message:received", message);
      }

      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      logger.error("Error in sendMessage:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  static async getMessages(req: AuthRequest, res: Response) {
    try {
      const conversations = await messageService.getUserConversations(
        req.user!.id,
        "VENDOR",
      );

      res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      logger.error("Error in getMessages:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  static async getConversations(req: AuthRequest, res: Response) {
    try {
      const conversations = await messageService.getUserConversations(
        req.user!.id,
        "CUSTOMER",
      );

      res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      logger.error("Error in getConversations:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  static async getRoomMessages(req: AuthRequest, res: Response) {
    try {
      const { roomId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const messages = await messageService.getRoomMessages(
        roomId,
        parseInt(limit as string),
        parseInt(offset as string),
      );

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      logger.error("Error in getRoomMessages:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  static async deleteMessage(req: AuthRequest, res: Response) {
    try {
      const { messageId } = req.params;
      const deletedMessage = await messageService.deleteMessage(
        messageId,
        req.user!.id,
      );
      const io = (req.app as any).io;

      if (io) {
        io.to(`room:${deletedMessage.roomId}`).emit("message:deleted", {
          messageId,
        });
      }

      res.status(200).json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error: any) {
      logger.error("Error in deleteMessage:", error);
      const statusCode =
        error.message === "Unauthorized to delete this message" ? 403 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  static async getVendorReviews(req: AuthRequest, res: Response) {
    try {
      const result = await reviewService.getVendorReviews(req.user!.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error in getVendorReviews:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
}
