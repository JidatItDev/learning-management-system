import { Router } from 'express';
import { otpController } from '../../../controllers/otpController';
import {
  requestPasswordResetValidation,
  resendOTPValidation,
  setPasswordValidation,
  verifyOTPValidation,
} from '../../../middleware/otpValidator';
import { otpLimiter } from '../../../middleware/rateLimiters';

const otpRouter = Router();

/**
 * @route   POST /api/otp/verify
 * @desc    Verify user OTP (used in signup, reset, etc.)
 * @access  Public - Rate limited
 */
otpRouter.post(
  '/verify',
  otpLimiter,
  verifyOTPValidation,
  otpController.verifyOTP
);

/**
 * @route   POST /api/otp/set-password
 * @desc    Set password after successful OTP verification
 * @access  Public - Rate limited
 */
otpRouter.post(
  '/set-password',
  otpLimiter,
  setPasswordValidation,
  otpController.setPassword
);

/**
 * @route   POST /api/otp/forgot-password
 * @desc    Initiate password reset (send OTP)
 * @access  Public - Rate limited
 */
otpRouter.post(
  '/forgot-password',
  otpLimiter,
  requestPasswordResetValidation,
  otpController.requestPasswordReset
);

/**
 * @route   POST /api/otp/resend
 * @desc    Resend OTP to user
 * @access  Public - Rate limited
 */
otpRouter.post(
  '/resend',
  otpLimiter,
  resendOTPValidation,
  otpController.resendOTP
);

export default otpRouter;
