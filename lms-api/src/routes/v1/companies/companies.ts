import { Router } from 'express';
import { companyController } from '../../../controllers/companyController';
import {
  authenticate,
  requirePermission,
  PERMISSIONS,
} from '../../../middleware/authenticator';

import {
  getAllCompaniesValidation,
  getCompanyByIdValidation,
  createCompanyValidation,
  updateCompanyValidation,
  deleteCompanyValidation,
} from '../../../middleware/companyValidator';
import { companyLimiter } from '../../../middleware/rateLimiters';

const companyRouter = Router();

/**
 * @route   GET /api/companies
 * @desc    Get all companies (with optional filters)
 * @access  Private - Requires LIST_COMPANIES permission
 * @query   search, page, limit, etc.
 */
companyRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.LIST_COMPANIES),
  getAllCompaniesValidation,
  companyController.getAllCompanies
);

/**
 * @route   GET /api/companies/:id
 * @desc    Get a company by ID
 * @access  Private - Requires VIEW_COMPANY permission
 */
companyRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_COMPANY),
  getCompanyByIdValidation,
  companyController.getCompanyById
);

/**
 * @route   POST /api/companies
 * @desc    Create a new company
 * @access  Private - Requires CREATE_COMPANY permission
 */
companyRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CREATE_COMPANY),
  companyLimiter,
  createCompanyValidation,
  companyController.createCompany
);

/**
 * @route   PUT /api/companies/:id
 * @desc    Update an existing company
 * @access  Private - Requires UPDATE_COMPANY permission
 */
companyRouter.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.UPDATE_COMPANY),
  companyLimiter,
  updateCompanyValidation,
  companyController.updateCompany
);

/**
 * @route   DELETE /api/companies/:id
 * @desc    Delete a company
 * @access  Private - Requires DELETE_COMPANY permission
 */
companyRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.DELETE_COMPANY),
  companyLimiter,
  deleteCompanyValidation,
  companyController.deleteCompany
);

export default companyRouter;
