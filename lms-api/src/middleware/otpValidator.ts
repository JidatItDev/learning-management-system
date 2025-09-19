const { body } = require('express-validator');

// Validation middleware
export const verifyOTPValidation = [
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('otp')
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
];

export const setPasswordValidation = [
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

export const requestPasswordResetValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),
];

export const resendOTPValidation = [
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('purpose')
    .isIn(['verify', 'reset'])
    .withMessage('Purpose must be "verify" or "reset"'),
];
