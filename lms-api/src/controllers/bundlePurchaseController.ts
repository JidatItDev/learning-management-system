import { Request, Response, NextFunction } from 'express';
import { bundlePurchaseService } from '../services/bundlePurchaseService/bundlePurchaseService';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/authenticator';
import { validationResult } from 'express-validator';

export class BundlePurchaseController {
  async getAllBundlePurchases(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const { bundleId, purchasedBy, discountId, page, limit } = req.query;
      const filters: {
        bundleId?: string;
        purchasedBy?: string;
        discountId?: string;
        page?: number;
        limit?: number;
      } = {
        bundleId: bundleId as string,
        purchasedBy: purchasedBy as string,
        discountId: discountId as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await bundlePurchaseService.getAllBundlePurchases(filters);

      res.status(200).json({
        success: true,
        data: result.bundlePurchases,
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

  async getBundlePurchaseById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const bundlePurchase = await bundlePurchaseService.getBundlePurchaseById(req.params.id);

      res.status(200).json({
        success: true,
        data: bundlePurchase,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async createBundlePurchase(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const bundlePurchase = await bundlePurchaseService.createBundlePurchase({
        ...req.body,
        purchasedBy: req.user!.id,
      });

      res.status(201).json({
        success: true,
        data: bundlePurchase,
        message: 'Bundle purchase created successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async updateBundlePurchase(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const bundlePurchase = await bundlePurchaseService.updateBundlePurchase(req.params.id, req.body);

      res.status(200).json({
        success: true,
        data: bundlePurchase,
        message: 'Bundle purchase updated successfully',
        updatedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteBundlePurchase(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const result = await bundlePurchaseService.deleteBundlePurchase(req.params.id);

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

export const bundlePurchaseController = new BundlePurchaseController();