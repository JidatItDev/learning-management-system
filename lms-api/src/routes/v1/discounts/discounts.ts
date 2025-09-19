import { Router } from 'express';
import {
  getAllDiscountsValidation,
  getDiscountByIdValidation,
  createDiscountValidation,
  updateDiscountValidation,
  deleteDiscountValidation,
} from '../../../middleware/discountValidator';
import { discountController } from '../../../controllers/discountController';
import { authenticate, requirePermission, PERMISSIONS } from '../../../middleware/authenticator';
import { discountLimiter } from '../../../middleware/rateLimiters';

const discountRouter = Router();

/**
 * @route   GET /api/discounts
 * @desc    Get all discounts with optional filtering and pagination
 * @access  Private - Requires LIST_DISCOUNTS permission
 * @params  Query: bundleId, page, limit
 */
discountRouter.get(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.LIST_DISCOUNTS),
  getAllDiscountsValidation,
  discountController.getAllDiscounts
);

/**
 * @route   GET /api/discounts/:id
 * @desc    Get discount by ID
 * @access  Private - Requires VIEW_DISCOUNT permission
 * @params  Params: id
 */
discountRouter.get(
  '/:id',
  authenticate,
 //requirePermission(PERMISSIONS.VIEW_DISCOUNT),
  getDiscountByIdValidation,
  discountController.getDiscountById
);

/**
 * @route   POST /api/discounts
 * @desc    Create a new discount
 * @access  Private - Requires CREATE_DISCOUNT permission
 * @body    bundleIds, percentage, seats, expiryDate
 */
discountRouter.post(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.CREATE_DISCOUNT),
  //discountLimiter,
  createDiscountValidation,
  discountController.createDiscount
);

/**
 * @route   PUT /api/discounts/:id
 * @desc    Update an existing discount
 * @access  Private - Requires UPDATE_DISCOUNT permission
 * @params  Params: id
 * @body    bundleIds, percentage, seats, expiryDate
 */
discountRouter.put(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.UPDATE_DISCOUNT),
  //discountLimiter,
  updateDiscountValidation,
  discountController.updateDiscount
);

/**
 * @route   DELETE /api/discounts/:id
 * @desc    Delete a discount
 * @access  Private - Requires DELETE_DISCOUNT permission
 * @params  Params: id
 */
discountRouter.delete(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.DELETE_DISCOUNT),
  //discountLimiter,
  deleteDiscountValidation,
  discountController.deleteDiscount
);

export default discountRouter;

/**
 * Route Summary:
 *
 * GET Routes:
 * - GET /api/discounts          - Get all discounts with filtering/pagination
 * - GET /api/discounts/:id      - Get discount by ID
 *
 * POST Routes:
 * - POST /api/discounts         - Create new discount
 *
 * PUT Routes:
 * - PUT /api/discounts/:id      - Update existing discount
 *
 * DELETE Routes:
 * - DELETE /api/discounts/:id   - Delete discount
 *
 * Permission Requirements:
 * - LIST_DISCOUNTS: Get all discounts
 * - VIEW_DISCOUNT: Get discount by ID
 * - CREATE_DISCOUNT: Create new discount
 * - UPDATE_DISCOUNT: Update existing discount
 * - DELETE_DISCOUNT: Delete discount
 *
 * Special Middleware:
 * - authenticate: Validates user authentication
 * - requirePermission: Checks specific permission
 * - discountLimiter: Rate limiting for discount operations
 * - Various validation middleware for input validation
 *
 * Usage in main app:
 * import discountRoutes from './routes/discounts';
 * app.use('/api/discounts', discountRoutes);
 */