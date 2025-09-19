import { param } from 'express-validator';

const { body, query } = require('express-validator');

// Validation middleware
export const getAllCompaniesValidation = [
  query('name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Name must be at most 255 characters'),
  query('vatNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('VAT number must be at most 50 characters'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search term must be at most 255 characters'),
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

export const getCompanyByIdValidation = [
  query('id').isUUID().withMessage('Invalid company ID'),
];

export const createCompanyValidation = [
  body('name')
    .trim()
    .notEmpty()
    .isLength({ max: 255 })
    .withMessage('Name is required and must be at most 255 characters'),
  body('vatNumber')
    .trim()
    .notEmpty()
    .isLength({ min: 8, max: 15 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage(
      'VAT number is required, must be 8-15 characters, and contain only uppercase letters and numbers'
    ),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address must be at most 255 characters'),
];

export const updateCompanyValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .isLength({ max: 255 })
    .withMessage('Name must be at most 255 characters'),
  body('vatNumber')
    .optional()
    .trim()
    .isLength({ min: 8, max: 15 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage(
      'VAT number must be 8-15 characters and contain only uppercase letters and numbers'
    ),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Address must be at most 255 characters'),
];

export const deleteCompanyValidation = [
  param('id').isUUID().withMessage('Invalid company ID'),
];
