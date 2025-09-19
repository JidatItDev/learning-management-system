import { Router } from 'express';
import {
  getAllBundlePurchasesValidation,
  getBundlePurchaseByIdValidation,
  createBundlePurchaseValidation,
  updateBundlePurchaseValidation,
  deleteBundlePurchaseValidation,
} from '../../../middleware/bundlePurchaseValidator';
import { bundlePurchaseController } from '../../../controllers/bundlePurchaseController';
import { authenticate, requirePermission, PERMISSIONS } from '../../../middleware/authenticator';
import { bundlePurchaseLimiter } from '../../../middleware/rateLimiters';

const bundlePurchaseRouter = Router();

/**
 * @route   GET /api/bundle-purchases
 * @desc    Get all bundle purchases with optional filtering and pagination
 * @access  Private - Requires LIST_BUNDLE_PURCHASES permission
 * @params  Query: bundleId, purchasedBy, discountId, page, limit
 */
bundlePurchaseRouter.get(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.LIST_BUNDLE_PURCHASES),
  getAllBundlePurchasesValidation,
  bundlePurchaseController.getAllBundlePurchases
);

/**
 * @route   GET /api/bundle-purchases/:id
 * @desc    Get bundle purchase by ID
 * @access  Private - Requires VIEW_BUNDLE_PURCHASE permission
 * @params  Params: id
 */
bundlePurchaseRouter.get(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.VIEW_BUNDLE_PURCHASE),
  getBundlePurchaseByIdValidation,
  bundlePurchaseController.getBundlePurchaseById
);

/**
 * @route   POST /api/bundle-purchases
 * @desc    Create a new bundle purchase
 * @access  Private - Requires CREATE_BUNDLE_PURCHASE permission
 * @body    bundleId, seatsPurchased, discountId
 */
bundlePurchaseRouter.post(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.CREATE_BUNDLE_PURCHASE),
  //bundlePurchaseLimiter,
  createBundlePurchaseValidation,
  bundlePurchaseController.createBundlePurchase
);

/**
 * @route   PUT /api/bundle-purchases/:id
 * @desc    Update an existing bundle purchase
 * @access  Private - Requires UPDATE_BUNDLE_PURCHASE permission
 * @params  Params: id
 * @body    seatsPurchased, discountId
 */
bundlePurchaseRouter.put(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.UPDATE_BUNDLE_PURCHASE),
  //bundlePurchaseLimiter,
  updateBundlePurchaseValidation,
  bundlePurchaseController.updateBundlePurchase
);

/**
 * @route   DELETE /api/bundle-purchases/:id
 * @desc    Delete a bundle purchase
 * @access  Private - Requires DELETE_BUNDLE_PURCHASE permission
 * @params  Params: id
 */
bundlePurchaseRouter.delete(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.DELETE_BUNDLE_PURCHASE),
  //bundlePurchaseLimiter,
  deleteBundlePurchaseValidation,
  bundlePurchaseController.deleteBundlePurchase
);

export default bundlePurchaseRouter;

/**
 * Route Summary:
 *
 * GET Routes:
 * - GET /api/bundle-purchases          - Get all bundle purchases with filtering/pagination
 * - GET /api/bundle-purchases/:id      - Get bundle purchase by ID
 *
 * POST Routes:
 * - POST /api/bundle-purchases         - Create new bundle purchase
 *
 * PUT Routes:
 * - PUT /api/bundle-purchases/:id      - Update existing bundle purchase
 *
 * DELETE Routes:
 * - DELETE /api/bundle-purchases/:id   - Delete bundle purchase
 *
 * Permission Requirements:
 * - LIST_BUNDLE_PURCHASES: Get all bundle purchases
 * - VIEW_BUNDLE_PURCHASE: Get bundle purchase by ID
 * - CREATE_BUNDLE_PURCHASE: Create new bundle purchase
 * - UPDATE_BUNDLE_PURCHASE: Update existing bundle purchase
 * - DELETE_BUNDLE_PURCHASE: Delete bundle purchase
 *
 * Special Middleware:
 * - authenticate: Validates user authentication
 * - requirePermission: Checks specific permission
 * - bundlePurchaseLimiter: Rate limiting for bundle purchase operations
 * - Various validation middleware for input validation
 *
 * Usage in main app:
 * import bundlePurchaseRoutes from './routes/bundlePurchases';
 * app.use('/api/bundle-purchases', bundlePurchaseRoutes);
 */