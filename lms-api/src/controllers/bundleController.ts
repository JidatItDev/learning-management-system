import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, UserRole } from '../middleware/authenticator';
import { bundleService, CreateBundleData, UpdateBundleData, BundleFilters } from '../services/bundleService/index';
import { BundleType } from '../models/bundles/bundles';

export class BundleController {
  async getAllBundles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const filters: BundleFilters = {
        title: req.query.title as string,
        category: req.query.category as string,
        bundleType: req.query.bundleType as BundleType,
        courseId: req.query.courseId as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await bundleService.getAllBundles(filters);

      res.status(200).json({
        success: true,
        data: result.bundles,
        pagination: result.pagination,
        requestedBy: { id: req.user?.id, role: req.user?.role },
      });
    } catch (error) {
      next(error);
    }
  }

  async getBundleById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const { id } = req.params;
      const bundle = await bundleService.getBundleById(id);

      res.status(200).json({
        success: true,
        data: bundle,
        requestedBy: { id: req.user?.id, role: req.user?.role },
      });
    } catch (error) {
      next(error);
    }
  }

  async createBundle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      if (req.user!.role !== UserRole.ADMIN && req.user!.role !== UserRole.CONTRIBUTOR) {
        throw new AppError('Only admins or contributors can create bundles', 403);
      }

      const createData: CreateBundleData = {
        title: req.body.title,
        category: req.body.category,
        description: req.body.description,
        bundleType: req.body.bundleType,
        seatPrice: req.body.seatPrice,
        courseIds: req.body.courseIds,
      };

      const bundle = await bundleService.createBundle(createData);

      res.status(201).json({
        success: true,
        data: bundle,
        message: 'Bundle created successfully',
        createdBy: { id: req.user?.id, role: req.user?.role },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateBundle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const { id } = req.params;
      if (req.user!.role !== UserRole.ADMIN) {
        throw new AppError('Only admins can update bundles', 403);
      }

      const updateData: UpdateBundleData = {
        title: req.body.title,
        category: req.body.category,
        description: req.body.description,
        bundleType: req.body.bundleType,
        seatPrice: req.body.seatPrice,
        courseIds: req.body.courseIds,
      };

      const bundle = await bundleService.updateBundle(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Bundle updated successfully',
        data: bundle,
        updatedBy: { id: req.user?.id, role: req.user?.role },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteBundle(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const { id } = req.params;
      if (req.user!.role !== UserRole.ADMIN) {
        throw new AppError('Only admins can delete bundles', 403);
      }

      const result = await bundleService.deleteBundle(id);

      res.status(200).json({
        success: true,
        message: result.message,
        deletedBy: { id: req.user?.id, role: req.user?.role },
      });
    } catch (error) {
      next(error);
    }
  }

  async bundleExists(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const { id } = req.params;
      const exists = await bundleService.bundleExists(id);

      res.status(200).json({
        success: true,
        data: { exists },
        requestedBy: { id: req.user?.id, role: req.user?.role },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bundleController = new BundleController();
