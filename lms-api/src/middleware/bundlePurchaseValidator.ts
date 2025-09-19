import { body, query, param } from 'express-validator';

export const getAllBundlePurchasesValidation = [
  query('bundleId')
    .optional()
    .isUUID()
    .withMessage('Invalid bundle ID'),
  query('purchasedBy')
    .optional()
    .isUUID()
    .withMessage('Invalid purchasedBy user ID'),
  query('discountId')
    .optional()
    .isUUID()
    .withMessage('Invalid discount ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
];

export const getBundlePurchaseByIdValidation = [
  param('id').isUUID().withMessage('Invalid bundle purchase ID'),
];

export const createBundlePurchaseValidation = [
  body('bundleId').isUUID().withMessage('Invalid bundle ID'),
  body('seatsPurchased')
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Seats purchased must be at least 1'),
  body('discountId')
    .optional()
];

export const updateBundlePurchaseValidation = [
  param('id').isUUID().withMessage('Invalid bundle purchase ID'),
  body('seatsPurchased')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Seats purchased must be at least 1'),
  body('discountId')
    .optional()
    .isEmpty()
    .isUUID()
    .withMessage('Invalid discount ID'),
];

export const deleteBundlePurchaseValidation = [
  param('id').isUUID().withMessage('Invalid bundle purchase ID'),
];