import { Op } from 'sequelize';
import sequelize from '../../config/database';
import GroupBundle from '../../models/groupBundles/groupBundles';
import Group from '../../models/groups/groups';
import BundlePurchase from '../../models/bundlePurchases/bundlePurchases';
import { AppError } from '../../middleware/errorHandler';
import { CreateGroupBundleData, GroupBundleFilters, UpdateGroupBundleData } from './groupBundle.interface';
import { userService } from '../userService';

export class GroupBundleService {
  async getAllGroupBundles(filters: GroupBundleFilters = {}) {
    try {
      const whereClause: any = {};
      if (filters.groupId) {
        whereClause.groupId = filters.groupId;
      }
      if (filters.bundlePurchaseId) {
        whereClause.bundlePurchaseId = filters.bundlePurchaseId;
      }

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: groupBundles } = await GroupBundle.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: Group,
            as: 'group',
            attributes: ['id', 'name', 'companyId', 'signInType', 'gophishGroupID'],
          },
          {
            model: BundlePurchase,
            as: 'bundlePurchase',
            include: [
              {
                model: sequelize.models.Bundle,
                as: 'bundle',
                attributes: ['id', 'title', 'bundleType', 'seatPrice'],
              },
              {
                model: sequelize.models.Discount,
                as: 'discount',
                attributes: ['id', 'percentage', 'seats', 'expiryDate'],
              },
            ],
          },
        ],
      });

      return {
        groupBundles,
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
      throw new AppError('Failed to fetch group bundles', 500);
    }
  }

  async getGroupBundleById(id: string) {
    try {
      if (!id) {
        throw new AppError('Group bundle ID is required', 400);
      }

      const groupBundle = await GroupBundle.findByPk(id, {
        include: [
          {
            model: Group,
            as: 'group',
            attributes: ['id', 'name', 'companyId', 'signInType', 'gophishGroupID'],
          },
          {
            model: BundlePurchase,
            as: 'bundlePurchase',
            include: [
              {
                model: sequelize.models.Bundle,
                as: 'bundle',
                attributes: ['id', 'title', 'bundleType', 'seatPrice'],
              },
              {
                model: sequelize.models.Discount,
                as: 'discount',
                attributes: ['id', 'percentage', 'seats', 'expiryDate'],
              },
            ],
          },
        ],
      });

      if (!groupBundle) {
        throw new AppError('Group bundle not found', 404);
      }

      return groupBundle;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch group bundle', 500);
    }
  }

  async createGroupBundle(data: CreateGroupBundleData & { createdBy: string }) {
    const transaction = await sequelize.transaction();
    try {
      if (!data.groupId || !data.bundlePurchaseId) {
        throw new AppError('Group ID and bundle purchase ID are required', 400);
      }

      const group = await Group.findByPk(data.groupId, { transaction });
      if (!group) {
        throw new AppError('Group not found', 404);
      }

      const bundlePurchase = await BundlePurchase.findByPk(data.bundlePurchaseId, { transaction });
      if (!bundlePurchase) {
        throw new AppError('Bundle purchase not found', 404);
      }

      const userExists = await userService.userExists(data.createdBy);
      if (!userExists) {
        throw new AppError('CreatedBy user not found', 404);
      }

      const existingGroupBundle = await GroupBundle.findOne({
        where: { groupId: data.groupId, bundlePurchaseId: data.bundlePurchaseId },
        transaction,
      });
      if (existingGroupBundle) {
        throw new AppError('Group bundle already exists', 409);
      }

      const totalSeatsAllocated = await GroupBundle.sum('seatsAllocated', {
        where: { bundlePurchaseId: data.bundlePurchaseId },
        transaction,
      });
      const requestedSeats = data.seatsAllocated || 0;
      if (totalSeatsAllocated + requestedSeats > bundlePurchase.seatsPurchased) {
        throw new AppError('Total seats allocated cannot exceed seats purchased', 400);
      }

      const groupBundle = await GroupBundle.create(
        {
          groupId: data.groupId,
          bundlePurchaseId: data.bundlePurchaseId,
          seatsAllocated: requestedSeats,
        },
        { transaction }
      );

      await transaction.commit();
      return await this.getGroupBundleById(groupBundle.id);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create group bundle', 500);
    }
  }

  async updateGroupBundle(id: string, data: UpdateGroupBundleData) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) {
        throw new AppError('Group bundle ID is required', 400);
      }

      const groupBundle = await GroupBundle.findByPk(id, { transaction });
      if (!groupBundle) {
        throw new AppError('Group bundle not found', 404);
      }

      const updateData: any = {};
      if (data.seatsAllocated !== undefined) {
        const bundlePurchase = await BundlePurchase.findByPk(groupBundle.bundlePurchaseId, { transaction });
        if (!bundlePurchase) {
          throw new AppError('Bundle purchase not found', 404);
        }
        const totalSeatsAllocated = await GroupBundle.sum('seatsAllocated', {
          where: {
            bundlePurchaseId: groupBundle.bundlePurchaseId,
            id: { [Op.ne]: id },
          },
          transaction,
        });
        if (totalSeatsAllocated + data.seatsAllocated > bundlePurchase.seatsPurchased) {
          throw new AppError('Total seats allocated cannot exceed seats purchased', 400);
        }
        updateData.seatsAllocated = data.seatsAllocated;
      }

      await groupBundle.update(updateData, { transaction });

      await transaction.commit();
      return await this.getGroupBundleById(id);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update group bundle', 500);
    }
  }

  async deleteGroupBundle(id: string) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) {
        throw new AppError('Group bundle ID is required', 400);
      }

      const groupBundle = await GroupBundle.findByPk(id, { transaction });
      if (!groupBundle) {
        throw new AppError('Group bundle not found', 404);
      }

      await groupBundle.destroy({ transaction });

      await transaction.commit();
      return { message: 'Group bundle deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete group bundle', 500);
    }
  }
}

export const groupBundleService = new GroupBundleService();