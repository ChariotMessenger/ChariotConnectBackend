import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { CustomError } from "../middlewares/errorHandler";

export class CatalogService {
  static async createItem(
    vendorId: string,
    data: {
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
    },
  ) {
    try {
      const item = await prisma.catalogItem.create({
        data: {
          vendorId,
          name: data.name,
          description: data.description,
          price: data.price,
          imageUrl: data.imageUrl,
        },
      });

      logger.info(`Catalog item created: ${item.id} for vendor ${vendorId}`);
      return item;
    } catch (error) {
      logger.error("Error creating catalog item:", error);
      throw error;
    }
  }

  static async updateItem(itemId: string, vendorId: string, data: any) {
    try {
      // Verify vendor owns this item
      const existingItem = await prisma.catalogItem.findUnique({
        where: { id: itemId },
      });

      if (!existingItem || existingItem.vendorId !== vendorId) {
        throw new CustomError(
          "Item not found or unauthorized",
          404,
          "ITEM_NOT_FOUND",
        );
      }

      const item = await prisma.catalogItem.update({
        where: { id: itemId },
        data: {
          name: data.name || undefined,
          description: data.description || undefined,
          price: data.price || undefined,
          imageUrl: data.imageUrl || undefined,
          available: data.available !== undefined ? data.available : undefined,
        },
      });

      logger.info(`Catalog item updated: ${itemId}`);
      return item;
    } catch (error) {
      logger.error("Error updating catalog item:", error);
      throw error;
    }
  }

  static async deleteItem(itemId: string, vendorId: string) {
    try {
      // Verify vendor owns this item
      const existingItem = await prisma.catalogItem.findUnique({
        where: { id: itemId },
      });

      if (!existingItem || existingItem.vendorId !== vendorId) {
        throw new CustomError(
          "Item not found or unauthorized",
          404,
          "ITEM_NOT_FOUND",
        );
      }

      await prisma.catalogItem.delete({
        where: { id: itemId },
      });

      logger.info(`Catalog item deleted: ${itemId}`);
      return { success: true, message: "Item deleted" };
    } catch (error) {
      logger.error("Error deleting catalog item:", error);
      throw error;
    }
  }

  static async getVendorCatalog(vendorId: string) {
    try {
      const items = await prisma.catalogItem.findMany({
        where: { vendorId },
        orderBy: { createdAt: "desc" },
      });

      logger.info(`Vendor catalog fetched: ${vendorId}`);
      return items;
    } catch (error) {
      logger.error("Error fetching vendor catalog:", error);
      throw error;
    }
  }

  static async getItem(itemId: string) {
    try {
      const item = await prisma.catalogItem.findUnique({
        where: { id: itemId },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              phone: true,
            },
          },
        },
      });

      if (!item) {
        throw new CustomError("Item not found", 404, "ITEM_NOT_FOUND");
      }

      logger.info(`Catalog item fetched: ${itemId}`);
      return item;
    } catch (error) {
      logger.error("Error fetching catalog item:", error);
      throw error;
    }
  }

  static async toggleAvailability(
    itemId: string,
    vendorId: string,
    available: boolean,
  ) {
    try {
      // Verify vendor owns this item
      const existingItem = await prisma.catalogItem.findUnique({
        where: { id: itemId },
      });

      if (!existingItem || existingItem.vendorId !== vendorId) {
        throw new CustomError(
          "Item not found or unauthorized",
          404,
          "ITEM_NOT_FOUND",
        );
      }

      const item = await prisma.catalogItem.update({
        where: { id: itemId },
        data: { available },
      });

      logger.info(`Catalog item availability toggled: ${itemId}`);
      return item;
    } catch (error) {
      logger.error("Error toggling item availability:", error);
      throw error;
    }
  }
}

export const catalogService = CatalogService;
