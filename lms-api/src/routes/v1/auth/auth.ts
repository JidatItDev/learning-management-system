import { Router } from 'express';
import { authController } from '../../../controllers/authController';
import {
  loginValidation,
  refreshTokenValidation,
  logoutValidation,
  passwordlessInitiateValidation,
  passwordlessVerifyValidation,
} from '../../../middleware/authValidator';
import { loginRateLimiter } from '../../../middleware/rateLimiters';
import {
  authSuccessPage,
  authErrorPage,
  signupSuccessPage,
} from './auth-fallback-route';

const authRouter = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and issue access + refresh tokens
 * @access  Public (rate limited)
 */
authRouter.post(
  '/login',
  // loginRateLimiter,
  loginValidation,
  authController.login
);

/**
 * @route   POST /api/auth/passwordless/initiate
 * @desc    Initiate passwordless login by sending OTP to email
 * @access  Public (rate limited)
 */
authRouter.post(
  '/passwordless/initiate',
  loginRateLimiter,
  passwordlessInitiateValidation,
  authController.initiatePasswordlessLogin
);

/**
 * @route   POST /api/auth/passwordless/verify
 * @desc    Verify OTP and complete passwordless login
 * @access  Public
 */
authRouter.post(
  '/passwordless/verify',
  passwordlessVerifyValidation,
  authController.verifyPasswordlessLogin
);

/**
 * @route   GET /api/auth/microsoft
 * @desc    Initiate Microsoft login
 * @access  Public
 */
authRouter.get('/microsoft', authController.initiateMicrosoftLogin);

/**
 * @route   GET /api/auth/microsoft/callback
 * @desc    Callback from Microsoft login
 * @access  Public
 */
authRouter.get('/microsoft/callback', authController.microsoftCallback);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (requires valid refresh token)
 */
authRouter.post('/refresh', refreshTokenValidation, authController.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Revoke refresh token
 * @access  Public
 */
authRouter.post('/logout', logoutValidation, authController.logout);

authRouter.get('/auth/success', authSuccessPage);
authRouter.get('/auth/error', authErrorPage);
authRouter.get('/auth/signup-success', signupSuccessPage);

export default authRouter;
