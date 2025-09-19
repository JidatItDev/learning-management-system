import { body, param, query } from 'express-validator';

export const getAllLessonsValidation = [
  query('courseId')
    .optional()
    .isUUID()
    .withMessage('Valid courseId is required'),
  query('title')
    .optional()
    .isString()
    .trim()
    .withMessage('Title must be a string'),
  query('description')
    .optional()
    .isString()
    .trim()
    .withMessage('Description must be a string'),
  query('videoName')
    .optional()
    .isString()
    .trim()
    .withMessage('Video Name must be a string'),
  //query('videoUrl').optional().isURL().withMessage('Valid videoUrl is required'),
  query('createdBy')
    .optional()
    .isUUID()
    .withMessage('Valid createdBy ID is required'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const getLessonsByCourseValidation = [
  param('courseId').isUUID().withMessage('Valid courseId is required'),
  query('title')
    .optional()
    .isString()
    .trim()
    .withMessage('Title must be a string'),
  query('description')
    .optional()
    .isString()
    .trim()
    .withMessage('Description must be a string'),
  query('videoName')
    .optional()
    .isString()
    .trim()
    .withMessage('Video Name must be a string'),

  //query('videoUrl').optional().isURL().withMessage('Valid videoUrl is required'),
  query('createdBy')
    .optional()
    .isUUID()
    .withMessage('Valid createdBy ID is required'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const getLessonByIdValidation = [
  param('id').isUUID().withMessage('Valid lesson ID is required'),
];

export const createLessonValidation = [
  body('courseId').isUUID().withMessage('Valid courseId is required'),
  body('title')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .withMessage('Description must be a string'),
  body('videoName')
    .optional()
    .isString()
    .trim()
    .withMessage('Video Name must be a string'),

  //body('videoUrl').optional().isURL().withMessage('Valid videoUrl is required'),
];

export const updateLessonValidation = [
  param('id').isUUID().withMessage('Valid lesson ID is required'),
  body('courseId')
    .optional()
    .isUUID()
    .withMessage('Valid courseId is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .isString()
    .trim()
    .withMessage('Description must be a string'),
  body('videoName')
    .optional()
    .isString()
    .trim()
    .withMessage('Video Name must be a string'),

  //body('videoUrl').optional().isURL().withMessage('Valid videoUrl is required'),
];

export const deleteLessonValidation = [
  param('id').isUUID().withMessage('Valid lesson ID is required'),
];
