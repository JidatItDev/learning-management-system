import { Op } from 'sequelize';
import sequelize from '../../config/database';
import BundlePurchase from '../../models/bundlePurchases/bundlePurchases';
import Bundle from '../../models/bundles/bundles';
import Discount from '../../models/discounts/discounts';
import { AppError } from '../../middleware/errorHandler';
import {
  BundlePurchaseFilters,
  CreateBundlePurchaseData,
  UpdateBundlePurchaseData,
} from './bundlePurchase.interface';

export class BundlePurchaseService {
private async calculateTotalPrice(
  bundleId: string,
  seatsPurchased: number,
  discountId: string | null | undefined,
  transaction: any
): Promise<number> {
  const bundle = await Bundle.findByPk(bundleId, { transaction });
  if (!bundle) {
    throw new AppError('Bundle not found', 404);
  }

  let totalPrice = seatsPurchased * bundle.seatPrice;

  if (discountId) {
    const discount = await Discount.findByPk(discountId, { transaction });
    if (!discount) {
      throw new AppError('Discount not found', 404);
    }

    // Check if discount is active
    if (!discount.isActive) {
      throw new AppError('Discount is not active', 400);
    }

    // Check if discount has expired
    if (discount.expiryDate && discount.expiryDate <= new Date()) {
      throw new AppError('Discount has expired', 400);
    }

    let discountApplied = false;

    // Priority 1: Check seats-based discount first
    if (discount.seats !== null && discount.seats !== undefined) {
      
      if (seatsPurchased >= discount.seats.seatsThreshold) {
        totalPrice = totalPrice * (1 - discount.seats.percentage / 100);
        discountApplied = true;
      }
      // If seats threshold not met, fall back to percentage discount if available
      else {
        
        if (discount.percentage !== null && discount.percentage !== undefined && discount.percentage > 0) {
          
          if (discount.bundleId && discount.bundleId !== bundleId) {
            throw new AppError('Discount is not applicable to this bundle', 400);
          }
          totalPrice = totalPrice * (1 - discount.percentage / 100);
          discountApplied = true;
        }
        // Only throw error if no fallback percentage is available
        else {
          throw new AppError(
            `Seats purchased must be at least ${discount.seats.seatsThreshold} to apply this discount`,
            400
          );
        }
      }
    }
    // Priority 2: Percentage-based discount (when no seats discount exists)
    else if (discount.percentage !== null && discount.percentage !== undefined) {
      if (discount.bundleId && discount.bundleId !== bundleId) {
        throw new AppError('Discount is not applicable to this bundle', 400);
      }
      totalPrice = totalPrice * (1 - discount.percentage / 100);
      discountApplied = true;
    }

    if (!discountApplied) {
      throw new AppError('Invalid discount configuration', 400);
    }
  }

  return parseFloat(totalPrice.toFixed(2));
}

  async getAllBundlePurchases(filters: BundlePurchaseFilters = {}) {
    try {
      const whereClause: any = {};
      if (filters.bundleId) {
        whereClause.bundleId = filters.bundleId;
      }
      if (filters.purchasedBy) {
        whereClause.purchasedBy = filters.purchasedBy;
      }
      if (filters.discountId) {
        whereClause.discountId = filters.discountId;
      }

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: bundlePurchases } = await BundlePurchase.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            association: 'bundle',
            attributes: ['id', 'title', 'bundleType', 'seatPrice'],
          },
          {
            association: 'discount',
            attributes: ['id', 'percentage', 'seats', 'expiryDate', 'isActive'],
          },
          {
            association: 'purchasedByUser',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            association: 'groupBundles',
            include: [{ association: 'group', attributes: ['id', 'name'] }],
          },
        ],
      });

      return {
        bundlePurchases,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(count / limit),
          hasPreviousPage: page > 1,
          nextPage: page < Math.ceil(count / limit) ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
      };
    } catch (error) {
      throw new AppError('Failed to fetch bundle purchases', 500);
    }
  }

  async getBundlePurchaseById(id: string) {
    try {
      if (!id) {
        throw new AppError('Bundle purchase ID is required', 400);
      }

      const bundlePurchase = await BundlePurchase.findByPk(id, {
        include: [
          {
            association: 'bundle',
            attributes: ['id', 'title', 'bundleType', 'seatPrice'],
          },
          {
            association: 'discount',
            attributes: ['id', 'percentage', 'seats', 'expiryDate', 'isActive'],
          },
          {
            association: 'purchasedByUser',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            association: 'groupBundles',
            include: [{ association: 'group', attributes: ['id', 'name'] }],
          },
        ],
      });

      if (!bundlePurchase) {
        throw new AppError('Bundle purchase not found', 404);
      }

      return bundlePurchase;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch bundle purchase', 500);
    }
  }

  async createBundlePurchase(data: CreateBundlePurchaseData & { purchasedBy: string }) {
    const transaction = await sequelize.transaction();
    try {
      if (!data.bundleId || !data.seatsPurchased || !data.purchasedBy) {
        throw new AppError('Bundle ID, seats purchased, and purchasedBy are required', 400);
      }

      const totalPrice = await this.calculateTotalPrice(
        data.bundleId,
        data.seatsPurchased,
        data.discountId ?? null,
        transaction
      );

      const bundlePurchase = await BundlePurchase.create(
        {
          bundleId: data.bundleId,
          discountId: data.discountId || null,
          seatsPurchased: data.seatsPurchased,
          totalPrice,
          purchasedBy: data.purchasedBy,
        },
        { transaction }
      );

      await transaction.commit();
      return await this.getBundlePurchaseById(bundlePurchase.id);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create bundle purchase', 500);
    }
  }

  async updateBundlePurchase(id: string, data: UpdateBundlePurchaseData) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) {
        throw new AppError('Bundle purchase ID is required', 400);
      }

      const bundlePurchase = await BundlePurchase.findByPk(id, { transaction });
      if (!bundlePurchase) {
        throw new AppError('Bundle purchase not found', 404);
      }

      const updateData: any = {};
      let recalculatePrice = false;

      if (data.seatsPurchased !== undefined) {
        updateData.seatsPurchased = data.seatsPurchased;
        recalculatePrice = true;
      }
      if (data.discountId !== undefined) {
        updateData.discountId = data.discountId;
        recalculatePrice = true;
      }

      if (recalculatePrice) {
        updateData.totalPrice = await this.calculateTotalPrice(
          bundlePurchase.bundleId,
          data.seatsPurchased !== undefined
            ? data.seatsPurchased
            : bundlePurchase.seatsPurchased,
          data.discountId !== undefined
            ? data.discountId
            : bundlePurchase.discountId,
          transaction
        );
      }

      await bundlePurchase.update(updateData, { transaction });

      await transaction.commit();
      return await this.getBundlePurchaseById(id);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update bundle purchase', 500);
    }
  }

  async deleteBundlePurchase(id: string) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) {
        throw new AppError('Bundle purchase ID is required', 400);
      }

      const bundlePurchase = await BundlePurchase.findByPk(id, { transaction });
      if (!bundlePurchase) {
        throw new AppError('Bundle purchase not found', 404);
      }

      const groupBundles = await bundlePurchase.getGroupBundles();
      if (groupBundles.length > 0) {
        throw new AppError(
          'Cannot delete bundle purchase with associated group bundles',
          400
        );
      }

      await bundlePurchase.destroy({ transaction });

      await transaction.commit();
      return { message: 'Bundle purchase deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete bundle purchase', 500);
    }
  }
}

export const bundlePurchaseService = new BundlePurchaseService();