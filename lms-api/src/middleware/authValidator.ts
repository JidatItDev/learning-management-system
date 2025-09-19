const { body } = require('express-validator');

// Validation middleware
export const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

export const logoutValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

// New passwordless validators
export const passwordlessInitiateValidation = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email')
    .trim(),
];

export const passwordlessVerifyValidation = [
  body('userId')
    .isUUID()
    .withMessage('Must be a valid user ID'),
  body('otp')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
];