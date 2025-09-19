import { body, param, query } from 'express-validator';

export const getAllAttackSimulationsValidation = [
  query('courseId').optional().isUUID().withMessage('Valid course ID is required'),
  query('name').optional().isString().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be a string between 1 and 255 characters'),
  query('createdBy').optional().isUUID().withMessage('Valid creator ID is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

export const getAttackSimulationByIdValidation = [
  param('id').isUUID().withMessage('Valid attack simulation ID is required'),
];

export const createAttackSimulationValidation = [
  body('courseId').isUUID().withMessage('Valid course ID is required'),
  body('name').notEmpty().trim().isLength({ min: 1, max: 255 }).withMessage('Name is required and must be between 1 and 255 characters'),
  body('template').notEmpty().withMessage('Template is required'),
  body('url').isURL().withMessage('Valid URL is required'),
  body('page').notEmpty().trim().isLength({ min: 1 }).withMessage('Page is required'),
  body('smtp').notEmpty().trim().isLength({ min: 1, max: 500 }).withMessage('SMTP is required and must be between 1 and 500 characters'),
];

export const updateAttackSimulationValidation = [
  param('id').isUUID().withMessage('Valid attack simulation ID is required'),
  body('name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Name must be between 1 and 255 characters'),
  body('template').optional().notEmpty().withMessage('Template must be non-empty'),
  body('url').optional().isURL().withMessage('Valid URL is required'),
  body('page').optional().trim().isLength({ min: 1 }).withMessage('Page must be non-empty'),
  body('smtp').optional().trim().isLength({ min: 1, max: 500 }).withMessage('SMTP must be between 1 and 500 characters'),
];

export const deleteAttackSimulationValidation = [
  param('id').isUUID().withMessage('Valid attack simulation ID is required'),
];
