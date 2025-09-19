import { Request, Response, NextFunction } from 'express';
import { groupBundleService } from '../services/groupBundleService/groupBundleService';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, requirePermission, PERMISSIONS } from '../middleware/authenticator';
import { validationResult } from 'express-validator';

export class GroupBundleController {
  async getAllGroupBundles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const { groupId, bundlePurchaseId, page, limit } = req.query;
      const filters = {
        groupId: groupId as string,
        bundlePurchaseId: bundlePurchaseId as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await groupBundleService.getAllGroupBundles(filters);

      res.status(200).json({
        success: true,
        data: result.groupBundles,
        pagination: result.pagination,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getGroupBundleById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const groupBundle = await groupBundleService.getGroupBundleById(req.params.id);

      res.status(200).json({
        success: true,
        data: groupBundle,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async createGroupBundle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const groupBundle = await groupBundleService.createGroupBundle({
        ...req.body,
        createdBy: req.user!.id,
      });

      res.status(201).json({
        success: true,
        data: groupBundle,
        message: 'Group bundle created successfully',
        createdBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateGroupBundle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const groupBundle = await groupBundleService.updateGroupBundle(req.params.id, req.body);

      res.status(200).json({
        success: true,
        data: groupBundle,
        message: 'Group bundle updated successfully',
        updatedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteGroupBundle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const result = await groupBundleService.deleteGroupBundle(req.params.id);

      res.status(200).json({
        success: true,
        message: result.message,
        deletedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const groupBundleController = new GroupBundleController();