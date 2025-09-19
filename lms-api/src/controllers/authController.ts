import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService/authService';
import { AppError } from '../middleware/errorHandler';

const { validationResult } = require('express-validator');

export class AuthController {
  /**
   * Login user and issue tokens
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
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

      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Initiate passwordless login by sending OTP
   * POST /api/auth/passwordless/initiate
   */
  initiatePasswordlessLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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
      const result = await authService.initiatePasswordlessLogin({ email });

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
          userId: result.userId,
          role: result.role,
          signInType: result.signInType,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verify OTP and complete passwordless login
   * POST /api/auth/passwordless/verify
   */
  verifyPasswordlessLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
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
      const result = await authService.verifyPasswordlessLogin({ userId, otp });

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Initiate Microsoft login (for existing users)
   * POST /api/auth/microsoft
   */
  initiateMicrosoftLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await authService.initiateMicrosoftLogin();
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Microsoft callback - handles both regular login and signup completion
   * GET /api/auth/microsoft/callback
   */
  microsoftCallback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    try {
      const { code, state, error, error_description } = req.query;

      // Handle OAuth errors
      if (error) {
        console.error('Microsoft OAuth error:', { error, error_description });
        return this.handleOAuthError(res, error_description as string);
      }

      if (!code || typeof code !== 'string') {
        return this.handleOAuthError(res, 'Authorization code is required');
      }

      // Determine if this is login or signup based on state parameter
      if (state && typeof state === 'string') {
        // This is a signup completion
        return await this.handleSignupCallback(res, code, state);
      } else {
        // This is a regular login
        return await this.handleLoginCallback(res, code);
      }
    } catch (error) {
      console.error('Microsoft callback error:', error);

      // In development, return JSON error
      if (process.env.NODE_ENV === 'development') {
        return res.status(500).json({
          success: false,
          error:
            error instanceof AppError
              ? error.message
              : 'Microsoft authentication failed',
        });
      }

      // In production, redirect to error page
      return res.redirect(
        `${process.env.FRONTEND_LOGIN_ERROR_URL}?error=${encodeURIComponent(
          error instanceof AppError ? error.message : 'Authentication failed'
        )}`
      );
    }
  };

  /**
   * Handle login callback
   */
  private handleLoginCallback = async (res: Response, code: string) => {
    const result = await authService.microsoftLogin(code);

    const { accessToken, refreshToken, user } = result;

    // Development environment - return JSON for easy testing
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        success: true,
        data: { accessToken, refreshToken, user },
        message: 'Microsoft login successful',
        redirectUrl:
          process.env.FRONTEND_LOGIN_SUCCESS_URL ||
          'http://localhost:3000/api/v1/auth/success',
      });
    }

    // Fallback URL if frontend URLs are not available
    const fallbackSuccessUrl = `http://localhost:3000/api/v1/auth/success`;
    const successUrl =
      process.env.FRONTEND_LOGIN_SUCCESS_URL || fallbackSuccessUrl;

    // 🚩 TEMP: send tokens + user in query params
    return res.redirect(
      `${successUrl}?accessToken=${encodeURIComponent(
        accessToken
      )}&refreshToken=${encodeURIComponent(
        refreshToken
      )}&user=${encodeURIComponent(JSON.stringify(user))}`
    );
  };

  /**
   * Handle signup callback
   */
  private handleSignupCallback = async (
    res: Response,
    code: string,
    state: string
  ) => {
    const result = await authService.completeMicrosoftSignup(code, state);

    // Development environment - return JSON
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        },
        message: 'Microsoft signup completed successfully',
        redirectUrl:
          process.env.FRONTEND_SIGNUP_SUCCESS_URL ||
          'http://localhost:3000/auth/signup-success',
      });
    }

    // Fallback URL if frontend URLs are not available
    const fallbackSignupUrl = `http://localhost:3000/auth/signup-success`;
    const signupUrl =
      process.env.FRONTEND_SIGNUP_SUCCESS_URL || fallbackSignupUrl;

    // Production environment - set cookies and redirect
    this.setAuthCookies(res, result.accessToken!, result.refreshToken!);
    return res.redirect(`${signupUrl}?welcome=true`);
  };

  /**
   * Handle OAuth errors
   */
  private handleOAuthError = (res: Response, errorMessage: string) => {
    // Development environment - return JSON error
    if (process.env.NODE_ENV === 'development') {
      return res.status(400).json({
        success: false,
        error: `Microsoft OAuth error: ${errorMessage}`,
      });
    }

    // Fallback URL if frontend URLs are not available
    const fallbackErrorUrl = `http://localhost:3000/auth/error?message=${encodeURIComponent(errorMessage)}`;
    const errorUrl = process.env.FRONTEND_LOGIN_ERROR_URL || fallbackErrorUrl;

    // Production environment - redirect to error page
    return res.redirect(
      `${errorUrl}?error=${encodeURIComponent(errorMessage)}`
    );
  };

  /**
   * Set authentication cookies
   */
  private setAuthCookies = (
    res: Response,
    accessToken: string,
    refreshToken: string
  ) => {
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  };

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refresh = async (req: Request, res: Response, next: NextFunction) => {
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

      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout (revoke refresh token)
   * POST /api/auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction) => {
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

      const { refreshToken } = req.body;
      const result = await authService.revokeToken(refreshToken);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
}

// Export singleton instance
export const authController = new AuthController();
