import { body, query, param } from 'express-validator';

export const getAllDiscountsValidation = [
  query('bundleId')
    .optional()
    .isUUID()
    .withMessage('Invalid bundle ID'),
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

export const getDiscountByIdValidation = [
  param('id').isUUID().withMessage('Invalid discount ID'),
];

export const createDiscountValidation = [
  body('bundleIds')
    .optional()
    .isArray()
    .withMessage('bundleIds must be an array')
    .custom((value) => {
      if (value && value.some((id: string) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        throw new Error('All bundleIds must be valid UUIDs');
      }
      return true;
    }),
  body('percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage must be between 0 and 100'),
  body('seats')
    .optional()
    .custom((value) => {
      if (value) {
        if (typeof value.percentage !== 'number' || typeof value.seatsThreshold !== 'number') {
          throw new Error('seats must have percentage and seatsThreshold as numbers');
        }
        if (value.percentage < 0 || value.percentage > 100) {
          throw new Error('seats.percentage must be between 0 and 100');
        }
        if (value.seatsThreshold < 1) {
          throw new Error('seats.seatsThreshold must be at least 1');
        }
      }
      return true;
    }),
  body('expiryDate')
    .optional()
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value && value <= new Date()) {
        throw new Error('expiryDate must be in the future');
      }
      return true;
    }),
  body().custom((body) => {
    if (!body.percentage && !body.seats) {
      throw new Error('At least one of percentage or seats is required');
    }
    return true;
  }),
];

export const updateDiscountValidation = [
  param('id').isUUID().withMessage('Invalid discount ID'),
  body('bundleIds')
    .optional()
    .isArray()
    .withMessage('bundleIds must be an array')
    .custom((value) => {
      if (value && value.some((id: string) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        throw new Error('All bundleIds must be valid UUIDs');
      }
      return true;
    }),
  body('percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage must be between 0 and 100'),
  body('seats')
    .optional()
    .custom((value) => {
      if (value) {
        if (typeof value.percentage !== 'number' || typeof value.seatsThreshold !== 'number') {
          throw new Error('seats must have percentage and seatsThreshold as numbers');
        }
        if (value.percentage < 0 || value.percentage > 100) {
          throw new Error('seats.percentage must be between 0 and 100');
        }
        if (value.seatsThreshold < 1) {
          throw new Error('seats.seatsThreshold must be at least 1');
        }
      }
      return true;
    }),
  body('expiryDate')
    .optional()
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value && value <= new Date()) {
        throw new Error('expiryDate must be in the future');
      }
      return true;
    }),
];

export const deleteDiscountValidation = [
  param('id').isUUID().withMessage('Invalid discount ID'),
];