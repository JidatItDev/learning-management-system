const { body, query, param } = require('express-validator');

export const getAllGroupsValidation = [
  query('name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Name must be at most 255 characters'),
  query('companyId').optional().isUUID().withMessage('Invalid company ID'),
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

export const getGroupByIdValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
];

export const createGroupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .isLength({ max: 255 })
    .withMessage('Name is required and must be at most 255 characters'),
  body('companyId').isUUID().withMessage('Invalid company ID'),
];

export const createGroupWithLeaderValidation = [
  body('name')
    .trim()
    .notEmpty()
    .isLength({ max: 255 })
    .withMessage('Name is required and must be at most 255 characters'),
  body('companyId').isUUID().withMessage('Invalid company ID'),
  body('groupLeader.firstName')
    .trim()
    .notEmpty()
    .isLength({ max: 255 })
    .withMessage('First name is required and must be at most 255 characters'),
  body('groupLeader.lastName')
    .trim()
    .notEmpty()
    .isLength({ max: 255 })
    .withMessage('Last name is required and must be at most 255 characters'),
  body('groupLeader.email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),
  body('groupLeader.signInType')
    .isIn(['withPassword', 'passwordless', 'microsoftEntraID'])
    .withMessage('Invalid signInType'),
];

export const updateGroupValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .isLength({ max: 255 })
    .withMessage('Name must be at most 255 characters'),
];

export const toggleGroupStatusValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
];

export const deleteGroupValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
];

export const getGroupsByCompanyValidation = [
  param('companyId').isUUID().withMessage('Invalid company ID'),
];

export const getGroupMembersValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
];
