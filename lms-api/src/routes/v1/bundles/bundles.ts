import { Router } from 'express';
import { bundleController } from '../../../controllers/bundleController';
import {
  authenticate,
  requirePermission,
  PERMISSIONS,
  requireCourseCreationPermission,
  requireCourseManagementPermission,
} from '../../../middleware/authenticator';
import {
  getAllBundlesValidation,
  getBundleByIdValidation,
  createBundleValidation,
  updateBundleValidation,
  deleteBundleValidation,
} from '../../../middleware/bundleValidator';
//import { bundleLimiter } from '../../../middleware/rateLimiters';
//import { BundleType } from '../../models/bundles/bundles';

const bundleRouter = Router();

/**
 * @route   GET /api/bundles
 * @desc    Get all bundles with optional filtering and pagination
 * @access  Private - Requires LIST_BUNDLES permission
 * @query   title, bundleType, courseId, page, limit
 */
bundleRouter.get(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.LIST_BUNDLES),
  getAllBundlesValidation,
  bundleController.getAllBundles
);

/**
 * @route   GET /api/bundles/:id
 * @desc    Get a single bundle by ID
 * @access  Private - Requires VIEW_BUNDLE permission
 */
bundleRouter.get(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.VIEW_BUNDLE),
  getBundleByIdValidation,
  bundleController.getBundleById
);

/**
 * @route   POST /api/bundles
 * @desc    Create a new bundle
 * @access  Private - Admin or Contributor
 */
bundleRouter.post(
  '/',
  authenticate,
  //requireCourseCreationPermission,
  //bundleLimiter,
  createBundleValidation,
  bundleController.createBundle
);

/**
 * @route   PUT /api/bundles/:id
 * @desc    Update an existing bundle
 * @access  Private - Admin only
 */
bundleRouter.put(
  '/:id',
  authenticate,
  //requireCourseManagementPermission,
  //bundleLimiter,
  updateBundleValidation,
  bundleController.updateBundle
);

/**
 * @route   DELETE /api/bundles/:id
 * @desc    Delete a bundle
 * @access  Private - Admin only
 */
bundleRouter.delete(
  '/:id',
  authenticate,
  //requireCourseManagementPermission,
  //bundleLimiter,
  deleteBundleValidation,
  bundleController.deleteBundle
);

/**
 * @route   GET /api/bundles/:id/exists
 * @desc    Check if bundle exists
 * @access  Private - Requires VIEW_BUNDLE permission
 */
bundleRouter.get(
  '/:id/exists',
  authenticate,
  //requirePermission(PERMISSIONS.VIEW_BUNDLE),
  //getBundleByIdValidation,
  bundleController.bundleExists
);

export default bundleRouter;
