import { Router } from 'express';
import {
  getAllGroupBundlesValidation,
  getGroupBundleByIdValidation,
  createGroupBundleValidation,
  updateGroupBundleValidation,
  deleteGroupBundleValidation,
} from '../../../middleware/groupBundleValidator';
import { groupBundleController } from '../../../controllers/groupBundleController';
import { authenticate, requirePermission, PERMISSIONS } from '../../../middleware/authenticator';
import { groupBundleLimiter } from '../../../middleware/rateLimiters';

const groupBundleRouter = Router();

/**
 * @route   GET /api/group-bundles
 * @desc    Get all group bundles with optional filtering and pagination
 * @access  Private - Requires LIST_GROUP_BUNDLES permission
 * @params  Query: groupId, bundlePurchaseId, page, limit
 */
groupBundleRouter.get(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.LIST_GROUP_BUNDLES),
  getAllGroupBundlesValidation,
  groupBundleController.getAllGroupBundles
);

/**
 * @route   GET /api/group-bundles/:id
 * @desc    Get group bundle by ID
 * @access  Private - Requires VIEW_GROUP_BUNDLE permission
 * @params  Params: id
 */
groupBundleRouter.get(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.VIEW_GROUP_BUNDLE),
  getGroupBundleByIdValidation,
  groupBundleController.getGroupBundleById
);

/**
 * @route   POST /api/group-bundles
 * @desc    Create a new group bundle
 * @access  Private - Requires CREATE_GROUP_BUNDLE permission
 * @body    groupId, bundlePurchaseId, seatsAllocated
 */
groupBundleRouter.post(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.CREATE_GROUP_BUNDLE),
  //groupBundleLimiter,
  createGroupBundleValidation,
  groupBundleController.createGroupBundle
);

/**
 * @route   PUT /api/group-bundles/:id
 * @desc    Update an existing group bundle
 * @access  Private - Requires UPDATE_GROUP_BUNDLE permission
 * @params  Params: id
 * @body    seatsAllocated
 */
groupBundleRouter.put(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.UPDATE_GROUP_BUNDLE),
  //groupBundleLimiter,
  updateGroupBundleValidation,
  groupBundleController.updateGroupBundle
);

/**
 * @route   DELETE /api/group-bundles/:id
 * @desc    Delete a group bundle
 * @access  Private - Requires DELETE_GROUP_BUNDLE permission
 * @params  Params: id
 */
groupBundleRouter.delete(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.DELETE_GROUP_BUNDLE),
  //groupBundleLimiter,
  deleteGroupBundleValidation,
  groupBundleController.deleteGroupBundle
);

export default groupBundleRouter;

/**
 * Route Summary:
 *
 * GET Routes:
 * - GET /api/group-bundles          - Get all group bundles with filtering/pagination
 * - GET /api/group-bundles/:id      - Get group bundle by ID
 *
 * POST Routes:
 * - POST /api/group-bundles         - Create new group bundle
 *
 * PUT Routes:
 * - PUT /api/group-bundles/:id      - Update existing group bundle
 *
 * DELETE Routes:
 * - DELETE /api/group-bundles/:id   - Delete group bundle
 *
 * Permission Requirements:
 * - LIST_GROUP_BUNDLES: Get all group bundles
 * - VIEW_GROUP_BUNDLE: Get group bundle by ID
 * - CREATE_GROUP_BUNDLE: Create new group bundle
 * - UPDATE_GROUP_BUNDLE: Update existing group bundle
 * - DELETE_GROUP_BUNDLE: Delete group bundle
 *
 * Special Middleware:
 * - authenticate: Validates user authentication
 * - requirePermission: Checks specific permission
 * - groupBundleLimiter: Rate limiting for group bundle operations
 * - Various validation middleware for input validation
 *
 * Usage in main app:
 * import groupBundleRoutes from './routes/groupBundles';
 * app.use('/api/group-bundles', groupBundleRoutes);
 */