import { body, param, query } from 'express-validator';

export const getAllProgressValidation = [
  query('userId').optional().isUUID().withMessage('Valid userId is required'),
  query('lessonId').optional().isUUID().withMessage('Valid lessonId is required'),
  query('courseId').optional().isUUID().withMessage('Valid courseId is required'),
  query('isCompleted').optional().isBoolean().withMessage('isCompleted must be a boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

export const getProgressByIdValidation = [
  param('id').isUUID().withMessage('Valid progress ID is required'),
];

export const createProgressValidation = [
  body('userId').isUUID().withMessage('Valid userId is required'),
  body('lessonId').isUUID().withMessage('Valid lessonId is required'),
  body('isCompleted').isBoolean().withMessage('isCompleted must be a boolean'),
];

export const updateProgressValidation = [
  param('id').isUUID().withMessage('Valid progress ID is required'),
  body('isCompleted').optional().isBoolean().withMessage('isCompleted must be a boolean'),
];

export const deleteProgressValidation = [
  param('id').isUUID().withMessage('Valid progress ID is required'),
];
