import { body, param, query } from 'express-validator';
import { BundleType } from '../models/bundles/bundles';

export const getAllBundlesValidation = [
  query('title').optional().isString().trim().withMessage('Title must be a string'),
  query('bundleType').optional().isIn(Object.values(BundleType)).withMessage('Invalid bundleType'),
  query('courseId').optional().isUUID().withMessage('Valid courseId is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

export const getBundleByIdValidation = [
  param('id').isUUID().withMessage('Valid bundle ID is required'),
];

export const createBundleValidation = [
  body('title').notEmpty().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters'),
  body('description').optional().isString().trim().withMessage('Description must be a string'),
  body('bundleType').isIn(Object.values(BundleType)).withMessage('Invalid bundleType'),
  body('seatPrice').isFloat({ min: 0 }).withMessage('Seat price must be a non-negative number'),
  body('courseIds').isArray({ min: 1 }).withMessage('At least one courseId is required'),
  body('courseIds.*').isUUID().withMessage('Invalid courseId in courseIds array'),
];

export const updateBundleValidation = [
  param('id').isUUID().withMessage('Valid bundle ID is required'),
  body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be between 1 and 255 characters'),
  body('description').optional().isString().trim().withMessage('Description must be a string'),
  body('bundleType').optional().isIn(Object.values(BundleType)).withMessage('Invalid bundleType'),
  body('seatPrice').optional().isFloat({ min: 0 }).withMessage('Seat price must be a non-negative number'),
  body('courseIds').optional().isArray({ min: 1 }).withMessage('At least one courseId is required'),
  body('courseIds.*').optional().isUUID().withMessage('Invalid courseId in courseIds array'),
];

export const deleteBundleValidation = [
  param('id').isUUID().withMessage('Valid bundle ID is required'),
];