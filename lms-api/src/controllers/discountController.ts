import { Request, Response, NextFunction } from 'express';
import { discountService } from '../services/discountService/discountService';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/authenticator';
import { validationResult } from 'express-validator';
import { CreateDiscountData, DiscountFilters } from '../services/discountService/discount.interface';

export class DiscountController {
  async getAllDiscounts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const { bundleId, includeInactive, page, limit } = req.query;
      const filters: DiscountFilters = {
        bundleId: bundleId as string,
        includeInactive: includeInactive === 'true',
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await discountService.getAllDiscounts(filters);

      res.status(200).json({
        success: true,
        data: result.discounts,
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

  async getDiscountById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const discount = await discountService.getDiscountById(req.params.id);

      res.status(200).json({
        success: true,
        data: discount,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async createDiscount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const discount = await discountService.createDiscount({
        ...req.body,
        createdBy: req.user!.id,
      });

      res.status(201).json({
        success: true,
        data: discount,
        message: 'Discount(s) created successfully',
        createdBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateDiscount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const discount = await discountService.updateDiscount(req.params.id, req.body);

      res.status(200).json({
        success: true,
        data: discount,
        message: 'Discount updated successfully',
        updatedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteDiscount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const result = await discountService.deleteDiscount(req.params.id);

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

  async toggleDiscountActive(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const result = await discountService.toggleDiscountActive(req.params.id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: { isActive: result.isActive },
        updatedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const discountController = new DiscountController();