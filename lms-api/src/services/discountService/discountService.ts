import { Op } from 'sequelize';
import sequelize from '../../config/database';
import Discount from '../../models/discounts/discounts';
import BundlePurchase from '../../models/bundlePurchases/bundlePurchases';
import Bundle from '../../models/bundles/bundles';
import { AppError } from '../../middleware/errorHandler';
import { validate as uuidValidate } from 'uuid';
import {
  DiscountFilters,
  CreateDiscountData,
  UpdateDiscountData,
} from './discount.interface';

export class DiscountService {
  async getAllDiscounts(filters: DiscountFilters = {}) {
    try {
      const whereClause: any = {};

      if (filters.bundleId) {
        whereClause.bundleId = filters.bundleId;
      }

      // Only fetch active discounts by default
      if (!filters.includeInactive) {
        whereClause.isActive = true;
      }

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: discounts } = await Discount.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      });

      return {
        discounts,
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
      throw new AppError('Failed to fetch discounts', 500);
    }
  }

  async getDiscountById(id: string) {
    try {
      if (!id) {
        throw new AppError('Discount ID is required', 400);
      }

      const discount = await Discount.findByPk(id);
      if (!discount) {
        throw new AppError('Discount not found', 404);
      }

      return discount;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch discount', 500);
    }
  }

  async createDiscount(data: CreateDiscountData & { createdBy: string }) {
    const transaction = await sequelize.transaction();
    try {
      if (!data.percentage && !data.seats) {
        throw new AppError(
          'At least one of percentage or seats is required',
          400
        );
      }

      const discounts: Discount[] = [];
      const bundleIds = data.bundleIds && Array.isArray(data.bundleIds) ? data.bundleIds : [null];

      for (const bundleId of bundleIds) {
        if (bundleId && !uuidValidate(bundleId)) {
          throw new AppError('All bundleIds must be valid UUIDs', 400);
        }

        if (
          data.seats &&
          (typeof data.seats.percentage !== 'number' ||
            typeof data.seats.seatsThreshold !== 'number')
        ) {
          throw new AppError(
            'seats must have percentage and seatsThreshold as numbers',
            400
          );
        }

        if (data.expiryDate && data.expiryDate <= new Date()) {
          throw new AppError('expiryDate must be in the future', 400);
        }

        const discount = await Discount.create(
          {
            bundleId: bundleId,
            percentage: data.percentage,
            seats: data.seats,
            expiryDate: data.expiryDate,
            isActive: true,
          },
          { transaction }
        );
        discounts.push(discount);
      }

      await transaction.commit();
      return discounts.length === 1 ? discounts[0] : discounts;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create discount', 500);
    }
  }

  async updateDiscount(id: string, data: UpdateDiscountData) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) {
        throw new AppError('Discount ID is required', 400);
      }

      const discount = await Discount.findByPk(id, { transaction });
      if (!discount) {
        throw new AppError('Discount not found', 404);
      }

      if (
        (data.percentage === null && data.seats === null) ||
        (!data.percentage && !data.seats && !data.bundleId && !data.expiryDate && data.isActive === undefined)
      ) {
        throw new AppError(
          'At least one of percentage, seats, bundleId, expiryDate, or isActive is required',
          400
        );
      }

      if (data.bundleId && !uuidValidate(data.bundleId)) {
        throw new AppError('bundleId must be a valid UUID', 400);
      }

      if (
        data.seats &&
        (typeof data.seats.percentage !== 'number' ||
          typeof data.seats.seatsThreshold !== 'number')
      ) {
        throw new AppError(
          'seats must have percentage and seatsThreshold as numbers',
          400
        );
      }

      if (data.expiryDate && data.expiryDate <= new Date()) {
        throw new AppError('expiryDate must be in the future', 400);
      }

      const updateData: any = {};
      if (data.bundleId !== undefined) updateData.bundleId = data.bundleId;
      if (data.percentage !== undefined) updateData.percentage = data.percentage;
      if (data.seats !== undefined) updateData.seats = data.seats;
      if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;

      await discount.update(updateData, { transaction });

      // If discount is deactivated, recalculate totalPrice for associated BundlePurchases
      if (data.isActive === false) {
        const bundlePurchases = await BundlePurchase.findAll({
          where: { discountId: id },
          transaction,
        });

        for (const purchase of bundlePurchases) {
          const bundle = await Bundle.findByPk(purchase.bundleId, { transaction });
          if (!bundle) {
            throw new AppError('Bundle not found', 404);
          }
          const originalPrice = purchase.seatsPurchased * bundle.seatPrice;
          await purchase.update({ totalPrice: parseFloat(originalPrice.toFixed(2)), discountId: null }, { transaction });
        }
      }

      await transaction.commit();
      return await this.getDiscountById(id);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update discount', 500);
    }
  }

  async deleteDiscount(id: string) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) {
        throw new AppError('Discount ID is required', 400);
      }

      const discount = await Discount.findByPk(id, { transaction });
      if (!discount) {
        throw new AppError('Discount not found', 404);
      }

      // Soft delete by setting isActive to false
      await discount.update({ isActive: false }, { transaction });

      // Recalculate totalPrice for associated BundlePurchases
      const bundlePurchases = await BundlePurchase.findAll({
        where: { discountId: id },
        transaction,
      });

      for (const purchase of bundlePurchases) {
        const bundle = await Bundle.findByPk(purchase.bundleId, { transaction });
        if (!bundle) {
          throw new AppError('Bundle not found', 404);
        }
        const originalPrice = purchase.seatsPurchased * bundle.seatPrice;
        await purchase.update({ totalPrice: parseFloat(originalPrice.toFixed(2)), discountId: null }, { transaction });
      }

      await transaction.commit();
      return { message: 'Discount deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete discount', 500);
    }
  }

  async toggleDiscountActive(id: string) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) {
        throw new AppError('Discount ID is required', 400);
      }

      const discount = await Discount.findByPk(id, { transaction });
      if (!discount) {
        throw new AppError('Discount not found', 404);
      }

      const newIsActive = !discount.isActive;
      await discount.update({ isActive: newIsActive }, { transaction });

      // If discount is deactivated, recalculate totalPrice for associated BundlePurchases
      if (!newIsActive) {
        const bundlePurchases = await BundlePurchase.findAll({
          where: { discountId: id },
          transaction,
        });

        for (const purchase of bundlePurchases) {
          const bundle = await Bundle.findByPk(purchase.bundleId, { transaction });
          if (!bundle) {
            throw new AppError('Bundle not found', 404);
          }
          const originalPrice = purchase.seatsPurchased * bundle.seatPrice;
          await purchase.update({ totalPrice: parseFloat(originalPrice.toFixed(2)), discountId: null }, { transaction });
        }
      }

      await transaction.commit();
      return { message: `Discount ${newIsActive ? 'activated' : 'deactivated'} successfully`, isActive: newIsActive };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to toggle discount active status', 500);
    }
  }

  async discountExists(id: string): Promise<boolean> {
    try {
      const discount = await Discount.findByPk(id);
      return !!discount;
    } catch (error) {
      return false;
    }
  }
}

export const discountService = new DiscountService();