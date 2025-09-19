import { Request, Response, NextFunction } from 'express';
import { companyService } from '../services/companyService';
import { AppError } from '../middleware/errorHandler';
import {
  AuthenticatedRequest,
  authenticate,
  requirePermission,
  PERMISSIONS,
} from '../middleware/authenticator';

const { validationResult } = require('express-validator');

export class CompanyController {
  /**
   * Get all companies with optional filtering and pagination
   * GET /api/companies
   * Required Permission: LIST_COMPANIES
   */
  async getAllCompanies(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' +
            errors
              .array()
              .map((e: any) => e.msg)
              .join(', '),
          400
        );
      }

      const { name, vatNumber, search, page, limit, createdBy } = req.query;

      const filters = {
        name: name as string,
        vatNumber: vatNumber as string,
        search: search as string,
        createdBy: createdBy as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await companyService.getAllCompanies(filters);

      res.status(200).json({
        success: true,
        data: result.companies,
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

  /**
   * Get company by ID
   * GET /api/companies/:id
   * Required Permission: VIEW_COMPANY
   */
  async getCompanyById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' +
            errors
              .array()
              .map((e: any) => e.msg)
              .join(', '),
          400
        );
      }

      const company = await companyService.getCompanyById(req.params.id);

      res.status(200).json({
        success: true,
        data: company,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new company
   * POST /api/companies
   * Required Permission: CREATE_COMPANY
   */
  async createCompany(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' +
            errors
              .array()
              .map((e: any) => e.msg)
              .join(', '),
          400
        );
      }

      const company = await companyService.createCompany({
        ...req.body,
        createdBy: req.user!.id,
      });
      res.status(201).json({
        success: true,
        data: company,
        message: 'Company created successfully',
        createdBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update an existing company
   * PUT /api/companies/:id
   * Required Permission: UPDATE_COMPANY
   */
  async updateCompany(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' +
            errors
              .array()
              .map((e: any) => e.msg)
              .join(', '),
          400
        );
      }

      const company = await companyService.updateCompany(
        req.params.id,
        req.body
      );

      res.status(200).json({
        success: true,
        data: company,
        message: 'Company updated successfully',
        updatedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a company
   * DELETE /api/companies/:id
   * Required Permission: DELETE_COMPANY
   */
  async deleteCompany(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' +
            errors
              .array()
              .map((e: any) => e.msg)
              .join(', '),
          400
        );
      }

      const result = await companyService.deleteCompany(req.params.id);

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

// Export singleton instance
export const companyController = new CompanyController();
