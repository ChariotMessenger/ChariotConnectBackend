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
      categoryId?: string;
    },
  ) {
    try {
      let categoryName: string | null = null;
      if (data.categoryId) {
        const category = await prisma.productCategory.findUnique({
          where: { id: data.categoryId },
        });
        if (category) categoryName = category.name;
      }

      const item = await prisma.catalogItem.create({
        data: {
          vendorId,
          categoryId: data.categoryId,
          categoryName,
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

      let categoryName = undefined;
      if (data.categoryId !== undefined) {
        if (data.categoryId === null) {
          categoryName = null;
        } else {
          const category = await prisma.productCategory.findUnique({
            where: { id: data.categoryId },
          });
          categoryName = category ? category.name : null;
        }
      }

      const item = await prisma.catalogItem.update({
        where: { id: itemId },
        data: {
          name: data.name ?? undefined,
          description: data.description ?? undefined,
          price: data.price ?? undefined,
          imageUrl: data.imageUrl ?? undefined,
          available: data.available ?? undefined,
          categoryId: data.categoryId ?? undefined,
          categoryName: categoryName,
        },
      });

      logger.info(`Catalog item updated: ${itemId}`);
      return item;
    } catch (error) {
      logger.error("Error updating catalog item:", error);
      throw error;
    }
  }

  static async getVendorCatalog(
    vendorId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [items, total] = await prisma.$transaction([
        prisma.catalogItem.findMany({
          where: { vendorId },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.catalogItem.count({ where: { vendorId } }),
      ]);

      return {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error fetching vendor catalog:", error);
      throw error;
    }
  }

  static async getVendorCategories(
    vendorId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [categories, total] = await prisma.$transaction([
        prisma.productCategory.findMany({
          where: { vendorId },
          skip,
          take: limit,
          orderBy: { name: "asc" },
        }),
        prisma.productCategory.count({ where: { vendorId } }),
      ]);

      return {
        categories,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error fetching categories:", error);
      throw error;
    }
  }

  static async createCategory(vendorId: string, name: string) {
    try {
      const category = await prisma.productCategory.create({
        data: { vendorId, name },
      });
      return category;
    } catch (error) {
      logger.error("Error creating category:", error);
      throw error;
    }
  }

  static async updateCategory(
    categoryId: string,
    vendorId: string,
    name: string,
  ) {
    try {
      const category = await prisma.productCategory.update({
        where: { id: categoryId, vendorId },
        data: { name },
      });

      await prisma.catalogItem.updateMany({
        where: { categoryId },
        data: { categoryName: name },
      });

      return category;
    } catch (error) {
      logger.error("Error updating category:", error);
      throw error;
    }
  }

  static async deleteCategory(categoryId: string, vendorId: string) {
    try {
      await prisma.productCategory.delete({
        where: { id: categoryId, vendorId },
      });
      return { success: true };
    } catch (error) {
      logger.error("Error deleting category:", error);
      throw error;
    }
  }

  static async deleteItem(itemId: string, vendorId: string) {
    try {
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

      await prisma.catalogItem.delete({ where: { id: itemId } });
      return { success: true, message: "Item deleted" };
    } catch (error) {
      logger.error("Error deleting catalog item:", error);
      throw error;
    }
  }

  static async getItem(itemId: string) {
    try {
      const item = await prisma.catalogItem.findUnique({
        where: { id: itemId },
        include: {
          vendor: {
            select: { id: true, businessName: true, phone: true },
          },
        },
      });
      if (!item) throw new CustomError("Item not found", 404, "ITEM_NOT_FOUND");
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

      return await prisma.catalogItem.update({
        where: { id: itemId },
        data: { available },
      });
    } catch (error) {
      logger.error("Error toggling availability:", error);
      throw error;
    }
  }
}

export const catalogService = CatalogService;
