// middleware/courseValidator.ts
import { body, param, query } from 'express-validator';

export const getAllCoursesValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('title').optional().isString().trim(),
  query('description').optional().isString().trim(),
  query('createdBy').optional().isUUID(),
];

export const getCourseByIdValidation = [
  param('id').isUUID().withMessage('Valid course ID is required'),
];

export const createCourseValidation = [
  body('title').notEmpty().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().isString().trim(),
];

export const updateCourseValidation = [
  param('id').isUUID().withMessage('Valid course ID is required'),
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().isString().trim(),
];

export const deleteCourseValidation = [
  param('id').isUUID().withMessage('Valid course ID is required'),
];