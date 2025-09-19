import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { AppError } from '../middleware/errorHandler';
import { otpService } from '../services/otpService/otpService';
import { authService } from '../services/authService/authService';

const { validationResult } = require('express-validator');

export class OTPController {
  /**
   * Verify OTP
   * POST /api/otp/verify
   */
  async verifyOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' +
            errors
              .array()
              .map((e: any) => e.msg)
              .join(', '),
          400
        );
      }

      const { userId, otp } = req.body;
      const result = await otpService.verifyOTP(userId, otp);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Set password after OTP verification
   * POST /api/otp/set-password
   */
  async setPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' +
            errors
              .array()
              .map((e: any) => e.msg)
              .join(', '),
          400
        );
      }

      const { userId, password } = req.body;

      // Set password
      const result = await authService.setUserPassword(userId, password);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Request password reset OTP
   * POST /api/otp/forgot-password
   */
  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' +
            errors
              .array()
              .map((e: any) => e.msg)
              .join(', '),
          400
        );
      }

      const { email } = req.body;
      const user = await userService.getUserByEmail(email);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.signInType !== 'withPassword') {
        throw new AppError(
          'User is not configured for password-based authentication',
          400
        );
      }

      const result = await otpService.generateAndSendOTP(
        user.id,
        user.email,
        'reset'
      );

      res.status(200).json({
        success: true,
        message: result.message,
        userId: user.id,
        role: user.role,
        signInType: user.signInType,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Resend OTP
   * POST /api/otp/resend
   */
  async resendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' +
            errors
              .array()
              .map((e: any) => e.msg)
              .join(', '),
          400
        );
      }

      const { userId, purpose } = req.body;
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.signInType !== 'withPassword') {
        throw new AppError(
          'User is not configured for password-based authentication',
          400
        );
      }

      const result = await otpService.generateAndSendOTP(
        user.id,
        user.email,
        purpose
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const otpController = new OTPController();
