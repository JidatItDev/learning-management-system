import { body, query, param } from 'express-validator';

export const getAllGroupBundlesValidation = [
  query('groupId')
    .optional()
    .isUUID()
    .withMessage('Invalid group ID'),
  query('bundlePurchaseId')
    .optional()
    .isUUID()
    .withMessage('Invalid bundle purchase ID'),
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

export const getGroupBundleByIdValidation = [
  param('id').isUUID().withMessage('Invalid group bundle ID'),
];

export const createGroupBundleValidation = [
  body('groupId').isUUID().withMessage('Invalid group ID'),
  body('bundlePurchaseId').isUUID().withMessage('Invalid bundle purchase ID'),
  body('seatsAllocated')
    .optional()
    .isInt({ min: 0 })
    .toInt()
    .withMessage('Seats allocated must be non-negative'),
];

export const updateGroupBundleValidation = [
  param('id').isUUID().withMessage('Invalid group bundle ID'),
  body('seatsAllocated')
    .optional()
    .isInt({ min: 0 })
    .toInt()
    .withMessage('Seats allocated must be non-negative'),
];

export const deleteGroupBundleValidation = [
  param('id').isUUID().withMessage('Invalid group bundle ID'),
];