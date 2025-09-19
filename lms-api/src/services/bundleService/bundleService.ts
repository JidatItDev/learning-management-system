import Bundle, { BundleType } from '../../models/bundles/bundles';
import { Course, BundleCourse } from '../../models';
import Discount from '../../models/discounts/discounts';
import { AppError } from '../../middleware/errorHandler';
import { Op } from 'sequelize';
import {
  BundleFilters,
  CreateBundleData,
  UpdateBundleData,
} from './bundle.interface';

export class BundleService {
  private getDiscountIncludeOptions() {
    return {
      model: Discount,
      as: 'discounts',
      required: false, // LEFT JOIN - include bundles even if they don't have discounts
      where: {
        isActive: true,
        [Op.or]: [
          { expiryDate: null }, // No expiry date
          { expiryDate: { [Op.gt]: new Date() } }, // Not expired
        ],
      },
      attributes: ['id', 'percentage', 'seats', 'expiryDate', 'isActive'],
    };
  }

  async getAllBundles(filters: BundleFilters = {}) {
    try {
      const whereClause: any = {};
      const includeOptions: any[] = [
        {
          model: Course,
          as: 'courses',
          attributes: ['id', 'title', 'description'],
          through: { attributes: [] },
        },
        this.getDiscountIncludeOptions(),
      ];

      if (filters.title) {
        whereClause.title = { [Op.like]: `%${filters.title}%` };
      }
      if (filters.category) {
        whereClause.category = { [Op.like]: `%${filters.category}%` };
      }
      if (filters.bundleType) {
        whereClause.bundleType = filters.bundleType;
      }
      if (filters.courseId) {
        includeOptions[0].where = { id: filters.courseId };
      }

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: bundles } = await Bundle.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: includeOptions,
        distinct: true, // Important when using includes to avoid counting duplicates
      });

      return {
        bundles,
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
      console.error('Error in getAllBundles:', error);
      throw new AppError('Failed to fetch bundles', 500);
    }
  }

  async getBundleById(id: string) {
    try {
      const bundle = await Bundle.findByPk(id, {
        include: [
          {
            model: Course,
            as: 'courses',
            attributes: ['id', 'title', 'description'],
            through: { attributes: [] },
          },
          this.getDiscountIncludeOptions(),
        ],
      });
      if (!bundle) {
        throw new AppError('Bundle not found', 404);
      }
      return bundle;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error in getBundleById:', error);
      throw new AppError('Failed to fetch bundle', 500);
    }
  }

  async createBundle(data: CreateBundleData) {
    try {
      if (
        !data.title ||
        !data.category ||
        !data.bundleType ||
        !data.seatPrice ||
        !data.courseIds ||
        data.courseIds.length === 0
      ) {
        throw new AppError(
          'Title, category, bundleType, seatPrice, and at least one courseId are required',
          400
        );
      }

      const courses = await Course.findAll({ where: { id: data.courseIds } });
      if (courses.length !== data.courseIds.length) {
        throw new AppError('One or more courses not found', 404);
      }

      const bundle = await Bundle.create({
        title: data.title,
        category: data.category,
        description: data.description,
        bundleType: data.bundleType,
        seatPrice: data.seatPrice,
      });

      await BundleCourse.bulkCreate(
        data.courseIds.map((courseId) => ({ bundleId: bundle.id, courseId }))
      );

      return await this.getBundleById(bundle.id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error in createBundle:', error);
      throw new AppError('Failed to create bundle', 500);
    }
  }

  async updateBundle(id: string, data: UpdateBundleData) {
    try {
      const bundle = await Bundle.findByPk(id);
      if (!bundle) {
        throw new AppError('Bundle not found', 404);
      }

      const updateData: any = {};
      if (data.title) updateData.title = data.title;
      if (data.category) updateData.category = data.category;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.bundleType) updateData.bundleType = data.bundleType;
      if (data.seatPrice !== undefined) updateData.seatPrice = data.seatPrice;

      if (data.courseIds) {
        const courses = await Course.findAll({ where: { id: data.courseIds } });
        if (courses.length !== data.courseIds.length) {
          throw new AppError('One or more courses not found', 404);
        }
        await BundleCourse.destroy({ where: { bundleId: id } });
        await BundleCourse.bulkCreate(
          data.courseIds.map((courseId) => ({ bundleId: id, courseId }))
        );
      }

      await bundle.update(updateData);
      return await this.getBundleById(id);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error in updateBundle:', error);
      throw new AppError('Failed to update bundle', 500);
    }
  }

  async deleteBundle(id: string) {
    try {
      const bundle = await Bundle.findByPk(id);
      if (!bundle) {
        throw new AppError('Bundle not found', 404);
      }
      await bundle.destroy();
      return { message: 'Bundle deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error in deleteBundle:', error);
      throw new AppError('Failed to delete bundle', 500);
    }
  }

  async bundleExists(id: string): Promise<boolean> {
    try {
      const bundle = await Bundle.findByPk(id, { attributes: ['id'] });
      return !!bundle;
    } catch (error) {
      console.error('Error in bundleExists:', error);
      return false;
    }
  }

  // Additional method to get active discounts for a specific bundle
  async getBundleDiscounts(bundleId: string) {
    try {
      const discounts = await Discount.findAll({
        where: {
          bundleId,
          isActive: true,
          [Op.or]: [
            { expiryDate: null },
            { expiryDate: { [Op.gt]: new Date() } },
          ],
        },
        attributes: ['id', 'percentage', 'seats', 'expiryDate', 'isActive'],
      });
      return discounts;
    } catch (error) {
      console.error('Error in getBundleDiscounts:', error);
      throw new AppError('Failed to fetch bundle discounts', 500);
    }
  }

  // Method to calculate discounted price based on seat count
  async calculateDiscountedPrice(bundleId: string, seatCount: number) {
    try {
      const bundle = await Bundle.findByPk(bundleId, {
        attributes: ['seatPrice'],
        include: [this.getDiscountIncludeOptions()],
      });

      if (!bundle) {
        throw new AppError('Bundle not found', 404);
      }

      let basePrice = Number(bundle.seatPrice) * seatCount;
      let applicableDiscount = null;
      let discountAmount = 0;

      // Find the best applicable discount
      if ((await bundle.getDiscounts()).length > 0) {
        for (const discount of await bundle.getDiscounts()) {
          let discountPercentage = 0;

          // Check percentage discount
          if (discount.percentage) {
            discountPercentage = discount.percentage;
          }

          // Check seats-based discount
          if (discount.seats && seatCount >= discount.seats.seatsThreshold) {
            discountPercentage = Math.max(
              discountPercentage,
              discount.seats.percentage
            );
          }

          // Keep the best discount
          if (discountPercentage > 0) {
            const currentDiscountAmount =
              (basePrice * discountPercentage) / 100;
            if (currentDiscountAmount > discountAmount) {
              discountAmount = currentDiscountAmount;
              applicableDiscount = discount;
            }
          }
        }
      }

      const finalPrice = basePrice - discountAmount;

      return {
        basePrice,
        discountAmount,
        finalPrice,
        applicableDiscount,
        seatCount,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Error in calculateDiscountedPrice:', error);
      throw new AppError('Failed to calculate discounted price', 500);
    }
  }
}

export const bundleService = new BundleService();
