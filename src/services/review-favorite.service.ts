import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { CustomError } from "../middlewares/errorHandler";

export class ReviewService {
  static async createReview(data: {
    vendorId: string;
    customerId: string;
    rating: number;
    comment?: string;
  }) {
    try {
      // Validate rating
      if (data.rating < 1 || data.rating > 5) {
        throw new CustomError(
          "Rating must be between 1 and 5",
          400,
          "INVALID_RATING",
        );
      }

      const review = await prisma.review.upsert({
        where: {
          vendorId_customerId: {
            vendorId: data.vendorId,
            customerId: data.customerId,
          },
        },
        create: {
          vendorId: data.vendorId,
          customerId: data.customerId,
          rating: data.rating,
          comment: data.comment,
        },
        update: {
          rating: data.rating,
          comment: data.comment,
        },
      });

      logger.info(`Review created/updated for vendor ${data.vendorId}`);
      return review;
    } catch (error) {
      logger.error("Error creating review:", error);
      throw error;
    }
  }

  static async getVendorReviews(vendorId: string) {
    try {
      const reviews = await prisma.review.findMany({
        where: { vendorId },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhotoUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Calculate average rating
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          : 0;

      logger.info(`Vendor reviews fetched: ${vendorId}`);

      return {
        reviews,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviews: reviews.length,
      };
    } catch (error) {
      logger.error("Error fetching vendor reviews:", error);
      throw error;
    }
  }

  static async deleteReview(vendorId: string, customerId: string) {
    try {
      const review = await prisma.review.findUnique({
        where: {
          vendorId_customerId: {
            vendorId,
            customerId,
          },
        },
      });

      if (!review) {
        throw new CustomError("Review not found", 404, "REVIEW_NOT_FOUND");
      }

      await prisma.review.delete({
        where: {
          vendorId_customerId: {
            vendorId,
            customerId,
          },
        },
      });

      logger.info(`Review deleted for vendor ${vendorId}`);
      return { success: true, message: "Review deleted" };
    } catch (error) {
      logger.error("Error deleting review:", error);
      throw error;
    }
  }
}

export class FavoriteService {
  static async addFavorite(customerId: string, vendorId: string) {
    try {
      const favorite = await prisma.favoriteVendor.upsert({
        where: {
          customerId_vendorId: {
            customerId,
            vendorId,
          },
        },
        create: {
          customerId,
          vendorId,
        },
        update: {},
      });

      logger.info(
        `Vendor added to favorites: ${vendorId} for customer ${customerId}`,
      );
      return favorite;
    } catch (error) {
      logger.error("Error adding favorite:", error);
      throw error;
    }
  }

  static async removeFavorite(customerId: string, vendorId: string) {
    try {
      const favorite = await prisma.favoriteVendor.findUnique({
        where: {
          customerId_vendorId: {
            customerId,
            vendorId,
          },
        },
      });

      if (!favorite) {
        throw new CustomError("Favorite not found", 404, "FAVORITE_NOT_FOUND");
      }

      await prisma.favoriteVendor.delete({
        where: {
          customerId_vendorId: {
            customerId,
            vendorId,
          },
        },
      });

      logger.info(
        `Vendor removed from favorites: ${vendorId} for customer ${customerId}`,
      );
      return { success: true, message: "Removed from favorites" };
    } catch (error) {
      logger.error("Error removing favorite:", error);
      throw error;
    }
  }

  static async getCustomerFavorites(customerId: string) {
    try {
      const favorites = await prisma.favoriteVendor.findMany({
        where: { customerId },
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              businessType: true,
              businessAddress: true,
              phone: true,
              profilePhotoUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      logger.info(`Customer favorites fetched: ${customerId}`);
      return favorites;
    } catch (error) {
      logger.error("Error fetching favorites:", error);
      throw error;
    }
  }

  static async isFavorite(
    customerId: string,
    vendorId: string,
  ): Promise<boolean> {
    try {
      const favorite = await prisma.favoriteVendor.findUnique({
        where: {
          customerId_vendorId: {
            customerId,
            vendorId,
          },
        },
      });

      return !!favorite;
    } catch (error) {
      logger.error("Error checking favorite status:", error);
      throw error;
    }
  }
}

export const reviewService = ReviewService;
export const favoriteService = FavoriteService;
