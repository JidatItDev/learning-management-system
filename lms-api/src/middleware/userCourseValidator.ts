import { body, param, query } from 'express-validator';

export const getAllUserCoursesValidation = [
  query('userId').optional().isUUID().withMessage('Valid userId is required'),
  query('courseId').optional().isUUID().withMessage('Valid courseId is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

export const getUserCourseByIdValidation = [
  param('id').isUUID().withMessage('Valid user-course ID is required'),
];

export const createUserCourseValidation = [
  body('userId').isUUID().withMessage('Valid userId is required'),
  body('courseId').isUUID().withMessage('Valid courseId is required'),
];

export const deleteUserCourseValidation = [
  param('id').isUUID().withMessage('Valid user-course ID is required'),
];