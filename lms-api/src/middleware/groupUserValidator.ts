const { body, query, param } = require('express-validator');

// Validation middleware
export const addGroupMemberValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('role')
    .isIn(['groupLeader', 'subscriber'])
    .withMessage('Invalid group role'),
];

export const createGroupMemberValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
  body('firstName')
    .trim()
    .notEmpty()
    .isLength({ max: 255 })
    .withMessage('First name is required and must be at most 255 characters'),
  body('lastName')
    .trim()
    .notEmpty()
    .isLength({ max: 255 })
    .withMessage('Last name is required and must be at most 255 characters'),
  body('email').trim().isEmail().withMessage('Invalid email format'),
  body('signInType')
    .isIn(['withPassword', 'passwordless', 'microsoftEntraID'])
    .withMessage('Invalid signInType'),
  body('role')
    .isIn(['groupLeader', 'subscriber'])
    .withMessage('Invalid group role'),
  // body('password')
  //   .if(body('signInType').equals('withPassword'))
  //   .notEmpty()
  //   .isLength({ min: 8 })
  //   .withMessage('Password must be at least 8 characters'),
];

export const removeGroupMemberValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
  param('userId').isUUID().withMessage('Invalid user ID'),
];

export const getGroupMemberValidation = [
  param('id').isUUID().withMessage('Invalid group ID'),
  param('userId').isUUID().withMessage('Invalid user ID'),
];
