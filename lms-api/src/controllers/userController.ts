// FIXED UserController - State Mismatch Issue Resolution
// Key fixes:
// 1. Fixed state generation and storage synchronization
// 2. Enhanced Redis debugging and state management
// 3. Fixed resend invitation flow to use correct state
// 4. Added proper error handling for state mismatches

import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { AppError } from '../middleware/errorHandler';
import {
  CreateUserData,
  UpdateUserData,
  UserFilters,
  MicrosoftSignupData,
} from '../services/userService';
import {
  AuthenticatedRequest,
  RBACService,
  UserRole,
  PERMISSIONS,
  authenticate,
  requirePermission,
  requireRoleCreationPermission,
  requireUserManagementPermission,
  requireRole,
  requireSelfOrPermission,
  toUserRole,
} from '../middleware/authenticator';
import { authService } from '../services/authService/authService';

const { validationResult } = require('express-validator');
import { otpService } from '../services/otpService/otpService';
import { emailService } from '../utils/emailService';
import redis from '../config/redis';
import axios from 'axios';
import { User } from '../models';
import { PasswordUtil } from '../utils/passwordUtil';

export class UserController {
  /**
   * Get all users with optional filtering and pagination
   * GET /api/users
   * Required Permission: LIST_USERS
   */
  async getAllUsers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const filters: UserFilters = {
        firstName: req.query?.firstName as string,
        lastName: req.query?.lastName as string,
        email: req.query?.email as string,
        role: req.query?.role as UserRole,
        isActive: req.query.isActive
          ? req.query.isActive === 'true'
          : undefined,
        invitationStatus: req.query?.invitationStatus as
          | 'none'
          | 'pending'
          | 'sent'
          | 'accepted'
          | 'expired',
        search: req.query?.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      };

      const result = await userService.getAllUsers(filters);

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   * Required Permission: VIEW_USER (or self access)
   */
  async getUserById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by email
   * GET /api/users/email/:email
   * Required Permission: VIEW_USER
   */
  async getUserByEmail(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = req.params;

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      const user = await userService.getUserByEmail(email);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      res.status(200).json({
        success: true,
        data: user,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new user
   * POST /api/users
   * Required Permission: CREATE_USER + role-specific creation permission
   */
  async createUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
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

      const userData: CreateUserData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        role: req.body.role,
        signInType: req.body.signInType,
        isActive: req.body.isActive,
      };

      let generatedPassword: string | undefined;
      if (userData.signInType === 'withPassword') {
        generatedPassword = PasswordUtil.generateSecurePassword();
        userData.password = generatedPassword;
      }

      const user = await userService.createUser(userData);

      if (userData.signInType === 'withPassword' && generatedPassword) {
        await otpService.generateAndSendOTP(
          user.id,
          user.email,
          'verify',
          generatedPassword
        );
      }

      res.status(201).json({
        success: true,
        data: user,
        message:
          userData.signInType === 'withPassword'
            ? 'User created successfully, OTP and password sent to email'
            : 'User created successfully',
        createdBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Enhanced Email Service Debugging
  // Add this to your UserController.ts to test email functionality

  /**
   * ENHANCED: Debug email configuration and test sending
   * GET /api/users/debug/email-config
   */
  async debugEmailConfig(req: Request, res: Response) {
    try {
      console.log('🔍 Email Configuration Debug');

      // Check environment variables
      const emailConfig = {
        SMTP_HOST: process.env.SMTP_HOST || 'NOT_SET',
        SMTP_PORT: process.env.SMTP_PORT || 'NOT_SET',
        SMTP_SECURE: process.env.SMTP_SECURE || 'NOT_SET',
        SMTP_USER: process.env.SMTP_USER ? 'SET (***hidden***)' : 'NOT_SET',
        SMTP_PASS: process.env.SMTP_PASS ? 'SET (***hidden***)' : 'NOT_SET',
        SMTP_FROM: process.env.SMTP_FROM || 'NOT_SET',
        NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
      };

      console.log('📧 Current Email Config:', emailConfig);

      // Test email service connection
      let connectionTest = false;
      let connectionError = null;

      try {
        connectionTest = await emailService.testConnection();
        console.log('📧 Connection Test Result:', connectionTest);
      } catch (error: any) {
        connectionError = error.message;
        console.error('📧 Connection Test Error:', error);
      }

      // Test basic nodemailer transporter creation
      let transporterTest = false;
      let transporterError = null;

      try {
        const nodemailer = require('nodemailer');
        const testTransporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await testTransporter.verify();
        transporterTest = true;
        console.log('📧 Transporter Test: SUCCESS');
      } catch (error: any) {
        transporterError = error.message;
        console.error('📧 Transporter Test: FAILED -', error);
      }

      res.json({
        success: true,
        data: {
          config: emailConfig,
          connectionTest: {
            success: connectionTest,
            error: connectionError,
          },
          transporterTest: {
            success: transporterTest,
            error: transporterError,
          },
          recommendations: [
            emailConfig.SMTP_HOST === 'NOT_SET'
              ? 'Set SMTP_HOST environment variable'
              : null,
            emailConfig.SMTP_USER === 'NOT_SET'
              ? 'Set SMTP_USER environment variable'
              : null,
            emailConfig.SMTP_PASS === 'NOT_SET'
              ? 'Set SMTP_PASS environment variable'
              : null,
            emailConfig.SMTP_FROM === 'NOT_SET'
              ? 'Set SMTP_FROM environment variable'
              : null,
          ].filter(Boolean),
        },
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * ENHANCED: Test email sending with detailed logging
   * POST /api/users/debug/test-email-detailed
   */
  async testEmailDetailed(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      console.log('📧 Starting detailed email test to:', email);
      console.log('📧 Timestamp:', new Date().toISOString());

      // Test 1: Basic email service connection
      console.log('📧 Test 1: Testing connection...');
      let connectionResult = null;
      let connectionError = null;

      try {
        connectionResult = await emailService.testConnection();
        console.log('📧 Connection result:', connectionResult);
      } catch (error: any) {
        connectionError = error.message;
        console.error('📧 Connection failed:', error);
      }

      // Test 2: Try sending a simple email
      console.log('📧 Test 2: Attempting to send simple email...');
      let simpleEmailResult = null;
      let simpleEmailError = null;

      try {
        const result = await emailService.sendEmail(
          email,
          'LMS System - Email Test',
          `
          <h2>Email Test Successful!</h2>
          <p>This is a test email to verify your email configuration.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>✅ Your email service is working correctly!</strong></p>
        `
        );
        simpleEmailResult = {
          messageId: result.messageId,
          response: result.response,
        };
        console.log('📧 Simple email sent successfully:', simpleEmailResult);
      } catch (error: any) {
        simpleEmailError = {
          message: error.message,
          code: error.code,
          command: error.command,
          responseCode: error.responseCode,
        };
        console.error('📧 Simple email failed:', simpleEmailError);
      }

      // Test 3: Try Microsoft invitation email
      console.log('📧 Test 3: Attempting Microsoft invitation email...');
      let invitationResult = null;
      let invitationError = null;

      try {
        const testState = 'test-state-' + Date.now();
        const testUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/microsoft-signup?state=${testState}`;

        const result = await emailService.sendMicrosoftInvitationEmail(
          email,
          'Test User',
          testUrl,
          'Test Organization'
        );

        invitationResult = {
          messageId: result.messageId,
          response: result.response,
        };
        console.log(
          '📧 Microsoft invitation sent successfully:',
          invitationResult
        );
      } catch (error: any) {
        invitationError = {
          message: error.message,
          code: error.code,
          command: error.command,
          responseCode: error.responseCode,
        };
        console.error('📧 Microsoft invitation failed:', invitationError);
      }

      res.json({
        success: true,
        data: {
          testEmail: email,
          timestamp: new Date().toISOString(),
          tests: {
            connection: {
              success: connectionResult,
              error: connectionError,
            },
            simpleEmail: {
              success: !!simpleEmailResult,
              result: simpleEmailResult,
              error: simpleEmailError,
            },
            microsoftInvitation: {
              success: !!invitationResult,
              result: invitationResult,
              error: invitationError,
            },
          },
          overallSuccess: !!simpleEmailResult || !!invitationResult,
        },
      });
    } catch (error: any) {
      console.error('📧 Email test failed:', error);
      res.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async initiateMicrosoftSignup(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      console.log('🔧 === ENHANCED Microsoft Signup Debug ===');
      console.log('🔧 Request body:', req.body);
      console.log('🔧 Timestamp:', new Date().toISOString());

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

      const { firstName, lastName, email, role } = req.body;

      if (!firstName || !lastName || !email || !role) {
        throw new AppError(
          'firstName, lastName, email, and role are required',
          400
        );
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase().trim() },
      });

      if (existingUser) {
        console.log('🔧 User already exists:', existingUser.id);
        throw new AppError('User already exists', 409);
      }

      // Create user
      const userData: CreateUserData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        role: role as UserRole,
        signInType: 'microsoftEntraID',
        isActive: false,
        invitationStatus: 'pending',
      };

      console.log('🔧 Creating user with data:', userData);
      const user = await userService.createUser(userData);
      console.log('🔧 Created user with ID:', user.id);

      // Generate state and store it
      const state = UserController.generateSecureRandomString();
      console.log('🔧 Generated state:', state);

      const stateData = {
        userId: user.id,
        email: user.email,
        role: user.role,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        action: 'initial_signup',
      };

      const redisKey = `microsoft-signup:${state}`;

      try {
        await redis.set(redisKey, JSON.stringify(stateData), { EX: 3600 });
        const verification = await redis.get(redisKey);
        if (!verification) {
          throw new Error('Redis verification failed');
        }
        console.log('🔧 Redis storage verified');
      } catch (redisError) {
        console.error('🔧 Redis error:', redisError);
        throw new AppError('Failed to store signup state', 500);
      }

      // UPDATED: Generate authorization URL first
      const authResult = await authService.initiateMicrosoftLogin(state);
      console.log(
        '🔧 Generated authorization URL:',
        authResult.authorizationUrl
      );

      // UPDATED: Send email with Microsoft OAuth URL directly
      let invitationSent = false;
      let invitationMethod = 'none';
      let detailedError = null;

      console.log('📧 === EMAIL SENDING DEBUG ===');

      try {
        console.log('📧 Testing email service connection...');
        const connectionTest = await emailService.testConnection();
        console.log('📧 Email service connection test:', connectionTest);

        if (!connectionTest) {
          throw new Error('Email service connection failed');
        }

        console.log('📧 Attempting to send Microsoft invitation email...');
        // UPDATED: Use authResult.authorizationUrl instead of custom frontend URL
        const emailResult = await emailService.sendMicrosoftInvitationEmail(
          email,
          firstName,
          authResult.authorizationUrl, // CHANGED: Direct Microsoft OAuth URL
          process.env.ORGANIZATION_NAME || 'LMS System'
        );

        console.log('📧 Email sent successfully:', {
          messageId: emailResult.messageId,
          response: emailResult.response,
        });

        invitationSent = true;
        invitationMethod = 'custom_email';
      } catch (emailError: any) {
        console.error('📧 Email sending error:', emailError);
        detailedError = {
          step: 'email_sending',
          error: emailError.message,
          code: emailError.code,
          command: emailError.command,
          responseCode: emailError.responseCode,
          stack: emailError.stack,
        };
      }

      // Update user status
      const updateStatus = invitationSent ? 'sent' : 'pending';
      await User.update(
        {
          invitationStatus: updateStatus,
          invitationSentAt: invitationSent ? new Date() : null,
        },
        { where: { id: user.id } }
      );

      const result = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          invitationStatus: updateStatus,
          canSignIn: false,
        },
        invitationSent,
        invitationMethod,
        authorizationUrl: authResult.authorizationUrl,
        state,
        message: invitationSent
          ? `User created and invitation sent successfully via ${invitationMethod}.`
          : 'User created. Email invitation failed but you can use the authorization URL.',
        // ADDED: Instructions for frontend
        instructions: {
          emailSent: invitationSent,
          nextSteps: invitationSent
            ? 'User should check their email and click the invitation link.'
            : 'Email failed. User should be redirected to the authorization URL manually.',
          authUrl: authResult.authorizationUrl,
        },
      };

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('🔧 Enhanced Microsoft signup error:', error);
      next(error);
    }
  }

  /**
   * FIXED: Send Microsoft Graph API invitation
   */
  private async sendMicrosoftGraphInvitation(
    email: string,
    displayName: string,
    state: string
  ): Promise<{ success: boolean; data?: any }> {
    try {
      // Get Microsoft Graph access token
      const accessToken = await this.getGraphAccessToken();

      // Construct the redirect URL with state
      const redirectUrl = `${process.env.AZURE_SIGNUP_REDIRECT_URI}?state=${state}`;

      const invitePayload = {
        invitedUserEmailAddress: email,
        inviteRedirectUrl: redirectUrl,
        sendInvitationMessage: true,
        invitedUserDisplayName: displayName,
        invitedUserMessageInfo: {
          messageLanguage: 'en-US',
          customizedMessageBody: `Hello ${displayName},\n\nYou have been invited to join our organization. Please click the link below to complete your registration.\n\nThis invitation will expire in 24 hours.`,
        },
      };

      console.log('🔧 Sending Graph invitation with payload:', {
        email,
        redirectUrl,
        displayName,
      });

      const response = await axios.post(
        'https://graph.microsoft.com/v1.0/invitations',
        invitePayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('🔧 Graph invitation response:', {
        status: response.status,
        invitedUserEmailAddress: response.data.invitedUserEmailAddress,
        inviteRedeemUrl: response.data.inviteRedeemUrl,
      });

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('🔧 Microsoft Graph invitation error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

      if (error.response?.status === 403) {
        throw new AppError(
          'Insufficient permissions for Microsoft Graph invitations. Ensure User.Invite.All permission is granted to the application.',
          403
        );
      }

      throw new AppError(
        `Microsoft Graph invitation failed: ${error.response?.data?.error?.message || error.message}`,
        500
      );
    }
  }

  /**
   * FIXED: Send custom email invitation as fallback (UPDATED for your email service)
   */
  private async sendCustomMicrosoftInvitation(
    email: string,
    firstName: string,
    state: string
  ): Promise<void> {
    try {
      console.log('📧 Sending custom Microsoft invitation email to:', email);

      // Construct the invitation URL with state
      const invitationUrl = `${process.env.FRONTEND_URL}/auth/microsoft-signup?state=${state}`;

      console.log('📧 Invitation URL:', invitationUrl);

      // Use the enhanced email service method for Microsoft invitations
      await emailService.sendMicrosoftInvitationEmail(
        email,
        firstName,
        invitationUrl,
        process.env.ORGANIZATION_NAME || 'our organization'
      );

      console.log(
        '📧 Custom Microsoft invitation email sent successfully to:',
        email
      );
    } catch (error) {
      console.error('📧 Custom email invitation error:', error);
      throw new AppError('Failed to send custom invitation email', 500);
    }
  }

  /**
   * ALTERNATIVE: Simple custom email version (if you prefer the basic approach)
   */
  private async sendCustomMicrosoftInvitationSimple(
    email: string,
    firstName: string,
    state: string
  ): Promise<void> {
    try {
      const invitationUrl = `${process.env.FRONTEND_URL}/auth/microsoft-signup?state=${state}`;

      const subject =
        'Microsoft Entra ID Invitation - Complete Your Registration';

      const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0078d4;">Microsoft Entra ID Invitation</h2>
        <p>Hello ${firstName},</p>
        <p>You have been invited to join our organization using Microsoft Entra ID authentication.</p>
        <p>To complete your registration, please click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" 
             style="background-color: #0078d4; 
                    color: white; 
                    padding: 12px 24px; 
                    text-decoration: none; 
                    border-radius: 4px; 
                    display: inline-block; 
                    font-weight: bold;">
            Complete Registration
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #0078d4; font-size: 14px;">${invitationUrl}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          <strong>Note:</strong> This invitation will expire in 1 hour.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          If you did not expect this invitation, please ignore this email.
        </p>
      </div>
    `;

      // Use the generic sendEmail method
      await emailService.sendEmail(email, subject, htmlContent);

      console.log('📧 Custom invitation email sent to:', email);
    } catch (error) {
      console.error('📧 Custom email invitation error:', error);
      throw new AppError('Failed to send custom invitation email', 500);
    }
  }

  /**
   * FIXED: Microsoft signup callback - handles signup completion
   * GET /api/users/microsoft-signup/callback
   */
  microsoftSignupCallback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<any> => {
    try {
      console.log('🔧 === Microsoft Signup Callback Debug ===');
      console.log('🔧 Query params:', req.query);
      console.log('🔧 Timestamp:', new Date().toISOString());

      const { code, state, error, error_description } = req.query;

      if (error) {
        console.error('🔧 Microsoft OAuth error:', {
          error,
          error_description,
        });
        return UserController.handleSignupError(
          res,
          error_description as string
        );
      }

      if (!code || typeof code !== 'string') {
        console.error('🔧 Missing authorization code');
        return UserController.handleSignupError(
          res,
          'Authorization code is required'
        );
      }

      if (!state || typeof state !== 'string') {
        console.error('🔧 Missing state parameter');
        return UserController.handleSignupError(
          res,
          'State parameter is required'
        );
      }

      console.log('🔧 Received state from callback:', state);

      // Check Redis connection
      try {
        await redis.ping();
        console.log('🔧 Redis connection: OK');
      } catch (pingError) {
        console.error('🔧 Redis connection failed:', pingError);
        throw new AppError('Redis connection failed', 500);
      }

      // Enhanced Redis debugging
      const allSignupKeys = await redis.keys('microsoft-signup:*');
      console.log('🔧 All Microsoft signup keys in Redis:', allSignupKeys);

      const targetKey = `microsoft-signup:${state}`;
      console.log('🔧 Looking for exact key:', targetKey);

      // Check if our exact key exists
      const keyExists = await redis.exists(targetKey);
      console.log('🔧 Target key exists:', !!keyExists);

      if (!keyExists) {
        console.error('🔧 State key not found in Redis!');
        console.log('🔧 Available keys:', allSignupKeys);

        // Log details of each available key
        for (const key of allSignupKeys) {
          const keyData = await redis.get(key);
          const keyTtl = await redis.ttl(key);
          console.log(
            `🔧 Available - Key: ${key}, TTL: ${keyTtl}s, Data: ${keyData ? keyData.substring(0, 200) : 'null'}`
          );
        }

        return UserController.handleSignupError(
          res,
          'Invalid or expired signup state - key not found'
        );
      }

      // Get the stored data
      const storedData = await redis.get(targetKey);
      console.log('🔧 Retrieved stored data:', storedData);

      if (!storedData) {
        return UserController.handleSignupError(res, 'No data found for state');
      }

      let signupData;
      try {
        signupData = JSON.parse(storedData);
        console.log('🔧 Parsed signup data:', signupData);
      } catch (parseError) {
        console.error('🔧 Parse error:', parseError);
        return UserController.handleSignupError(
          res,
          'Invalid signup state data format'
        );
      }

      // Validate the signup data
      if (!signupData.userId || !signupData.email) {
        console.error('🔧 Invalid signup data structure:', signupData);
        return UserController.handleSignupError(
          res,
          'Invalid signup data structure'
        );
      }

      console.log('🔧 Proceeding with Microsoft signup completion...');
      const result = await authService.completeMicrosoftSignup(code, state);

      // Clean up Redis state
      await redis.del(targetKey);
      console.log('🔧 Cleaned up Redis state');

      // Development environment - return JSON
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
          success: true,
          data: result,
          message: 'Microsoft Entra ID signup completed successfully',
        });
      }

      // Production environment - set cookies and redirect
      UserController.setAuthCookies(
        res,
        result.accessToken!,
        result.refreshToken!
      );
      return res.redirect(
        `${process.env.FRONTEND_SIGNUP_SUCCESS_URL}?welcome=true`
      );
    } catch (error) {
      console.error('🔧 Microsoft signup callback error:', error);
      return UserController.handleSignupError(
        res,
        error instanceof AppError ? error.message : 'Signup failed'
      );
    }
  };

  // UPDATED: Also update the resendMicrosoftInvitation method
  async resendMicrosoftInvitation(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      const user = await User.findByPk(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.signInType !== 'microsoftEntraID') {
        throw new AppError(
          'User is not configured for Microsoft Entra ID',
          400
        );
      }

      if (user.isInvitationAccepted()) {
        throw new AppError('Invitation has already been accepted', 400);
      }

      console.log('🔧 Resending invitation for user:', user.id);

      // Clean up any existing states for this user
      const existingKeys = await redis.keys('microsoft-signup:*');
      for (const key of existingKeys) {
        const data = await redis.get(key);
        if (data) {
          try {
            const parsedData = JSON.parse(data);
            if (parsedData.userId === user.id) {
              console.log('🔧 Cleaning up old state:', key);
              await redis.del(key);
            }
          } catch (e) {
            // Skip invalid data
          }
        }
      }

      // Generate NEW state for the resend
      const newState = UserController.generateSecureRandomString();
      console.log('🔧 Generated NEW state for resend:', newState);

      // Store NEW signup data in Redis
      const stateData = {
        userId: user.id,
        email: user.email,
        role: user.role,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
        action: 'resend_invitation',
      };

      const redisKey = `microsoft-signup:${newState}`;
      await redis.set(redisKey, JSON.stringify(stateData), { EX: 3600 });

      // Generate NEW authorization URL
      const authResult = await authService.initiateMicrosoftLogin(newState);

      // UPDATED: Send email with Microsoft OAuth URL
      let invitationSent = false;
      let invitationMethod = 'none';
      let invitationError = null;

      try {
        // UPDATED: Use authResult.authorizationUrl for resend too
        await emailService.sendMicrosoftInvitationEmail(
          user.email,
          user.firstName,
          authResult.authorizationUrl, // CHANGED: Direct Microsoft OAuth URL
          process.env.ORGANIZATION_NAME || 'LMS System'
        );
        invitationSent = true;
        invitationMethod = 'custom_email';
      } catch (emailError) {
        console.error('🔧 Custom email failed on resend:', emailError);
        invitationError = emailError;
      }

      // Update user status
      await User.update(
        {
          invitationStatus: invitationSent ? 'sent' : 'pending',
          invitationSentAt: invitationSent ? new Date() : user.invitationSentAt,
        },
        { where: { id: user.id } }
      );

      const result = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          invitationStatus: invitationSent ? 'sent' : 'pending',
          canSignIn: false,
        },
        invitationSent,
        invitationMethod,
        authorizationUrl: authResult.authorizationUrl,
        state: newState,
        message: invitationSent
          ? `Microsoft invitation resent successfully via ${invitationMethod}. Please check your email.`
          : 'Invitation state updated. Please use the authorization URL. Note: Email sending failed.',
        instructions: {
          emailSent: invitationSent,
          nextSteps: invitationSent
            ? 'User should check their email and click the invitation link.'
            : 'Email failed. User should be redirected to the authorization URL manually.',
          authUrl: authResult.authorizationUrl,
        },
      };

      res.status(200).json({
        success: true,
        data: result,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      console.error('🔧 Resend invitation error:', error);
      next(error);
    }
  }

  /**
   * Debug Redis state - Enhanced debugging
   * GET /api/users/debug/redis-state
   */
  async debugRedisState(req: Request, res: Response) {
    try {
      console.log('🔧 Testing Redis connection...');

      // Test basic Redis functionality
      const testKey = 'test-connection';
      await redis.set(testKey, 'working', { EX: 60 });
      const testResult = await redis.get(testKey);

      // Check all Microsoft signup states
      const allSignupKeys = await redis.keys('microsoft-signup:*');

      // Get details for each key
      const keyDetails = [];
      for (const key of allSignupKeys) {
        const value = await redis.get(key);
        const ttl = await redis.ttl(key);
        keyDetails.push({
          key,
          value: value ? JSON.parse(value) : null,
          ttl,
          expired: ttl <= 0,
          timeLeft:
            ttl > 0 ? `${Math.floor(ttl / 60)}m ${ttl % 60}s` : 'expired',
        });
      }

      res.json({
        success: true,
        data: {
          redisWorking: testResult === 'working',
          totalSignupStates: allSignupKeys.length,
          signupStates: keyDetails,
          redisKeys: allSignupKeys,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Generate secure random string for OAuth state
   */
  private static generateSecureRandomString(length: number = 32): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Handle signup errors
   */
  private static handleSignupError(res: Response, errorMessage: string) {
    if (process.env.NODE_ENV === 'development') {
      return res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }

    return res.redirect(
      `${process.env.FRONTEND_SIGNUP_ERROR_URL}?error=${encodeURIComponent(errorMessage)}`
    );
  }

  /**
   * Set authentication cookies
   */
  private static setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string
  ) {
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
  }

  /**
   * Get Microsoft invitation status
   * GET /api/users/:id/microsoft-invitation-status
   * Required Permission: VIEW_USER
   */
  async getMicrosoftInvitationStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      const user = await userService.getUserById(id);

      if (user.signInType !== 'microsoftEntraID') {
        throw new AppError(
          'User is not configured for Microsoft Entra ID',
          400
        );
      }

      res.status(200).json({
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          invitationStatus: user.invitationStatus,
          invitationSentAt: user.invitationSentAt,
          invitationAcceptedAt: user.invitationAcceptedAt,
          canSignIn: user.canSignIn,
          needsInvitationAcceptance: user.isInvitationPending,
        },
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing user
   * PUT /api/users/:id
   * Required Permission: UPDATE_USER + hierarchy check
   */
  async updateUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      // Get the current user to check hierarchy
      const currentUser = await userService.getUserById(id);

      // Safely convert the role
      const currentUserRole = toUserRole(currentUser.role);

      // Check if the requesting user can manage the target user
      if (!RBACService.canManageUser(req.user!.role, currentUserRole)) {
        throw new AppError(
          `Your role (${req.user!.role}) cannot manage users with role (${currentUserRole})`,
          403
        );
      }

      const updateData: UpdateUserData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        signInType: req.body.signInType,
        isActive: req.body.isActive,
      };

      // If updating role, check if the requesting user can create the new role
      if (updateData.role && updateData.role !== currentUser.role) {
        if (!RBACService.canCreateRole(req.user!.role, updateData.role)) {
          throw new AppError(
            `Your role (${req.user!.role}) cannot assign users to role (${updateData.role})`,
            403
          );
        }
      }

      const user = await userService.updateUser(id, updateData);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
        updatedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a user
   * DELETE /api/users/:id
   * Required Permission: DELETE_USER + hierarchy check
   */
  async deleteUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      // Prevent self-deletion
      if (id === req.user!.id) {
        throw new AppError('You cannot delete your own account', 400);
      }

      // Get the current user to check hierarchy
      const currentUser = await userService.getUserById(id);

      // Check if the requesting user can manage the target user
      if (
        !RBACService.canManageUser(req.user!.role, currentUser.role as UserRole)
      ) {
        throw new AppError(
          `Your role (${req.user!.role}) cannot delete users with role (${currentUser.role})`,
          403
        );
      }

      const result = await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: result.message,
        deletedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle user status (activate/deactivate)
   * PATCH /api/users/:id/toggle-status
   * Required Permission: TOGGLE_USER_STATUS + hierarchy check
   */
  async toggleUserStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      // Prevent self-deactivation
      if (id === req.user!.id) {
        throw new AppError('You cannot deactivate your own account', 400);
      }

      // Get the current user to check hierarchy
      const currentUser = await userService.getUserById(id);

      // Check if the requesting user can manage the target user
      if (
        !RBACService.canManageUser(req.user!.role, currentUser.role as UserRole)
      ) {
        throw new AppError(
          `Your role (${req.user!.role}) cannot toggle status for users with role (${currentUser.role})`,
          403
        );
      }

      const user = await userService.toggleUserStatus(id);

      res.status(200).json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        data: user,
        modifiedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if user exists
   * GET /api/users/:id/exists
   * Required Permission: VIEW_USER
   */
  async userExists(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      const exists = await userService.userExists(id);

      res.status(200).json({
        success: true,
        data: { exists },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get users by role
   * GET /api/users/role/:role
   * Required Permission: LIST_USERS
   */
  async getUsersByRole(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { role } = req.params;

      if (!role) {
        throw new AppError('Role is required', 400);
      }

      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(role as UserRole)) {
        throw new AppError(
          `Invalid role. Must be one of: ${validRoles.join(', ')}`,
          400
        );
      }

      const users = await userService.getUsersByRole(role as UserRole);

      res.status(200).json({
        success: true,
        data: users,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user groups
   * GET /api/users/:id/groups
   * Required Permission: VIEW_USER_GROUPS (or self access)
   */
  async getUserGroups(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;

      if (!id) {
        throw new AppError('User ID is required', 400);
      }

      const groups = await userService.getUserGroups(id);

      res.status(200).json({
        success: true,
        data: groups,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk create users
   * POST /api/users/bulk
   * Required Permission: BULK_CREATE_USERS + role-specific creation permissions
   */
  async bulkCreateUsers(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { users } = req.body;

      if (!users || !Array.isArray(users) || users.length === 0) {
        throw new AppError(
          'Users array is required and must not be empty',
          400
        );
      }

      // Validate all users before creating any
      for (const userData of users) {
        if (!userData.role) {
          throw new AppError('Role is required for all users', 400);
        }

        if (!RBACService.canCreateRole(req.user!.role, userData.role)) {
          throw new AppError(
            `Your role (${req.user!.role}) cannot create users with role (${userData.role})`,
            403
          );
        }
      }

      const createdUsers: any[] = [];
      const errors: any[] = [];

      for (let i = 0; i < users.length; i++) {
        try {
          const userData: CreateUserData = users[i];

          // Create user
          const user = await userService.createUser(userData);

          // Send OTP if needed
          if (userData.signInType === 'withPassword') {
            await otpService.generateAndSendOTP(user.id, user.email, 'verify');
          }

          createdUsers.push({
            user,
            message:
              userData.signInType === 'withPassword'
                ? 'User created successfully, OTP sent to email'
                : 'User created successfully',
          });
        } catch (error) {
          errors.push({
            index: i,
            userData: users[i],
            error: error instanceof AppError ? error.message : 'Unknown error',
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `${createdUsers.length} users created successfully`,
        data: {
          created: createdUsers,
          errors,
        },
        createdBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   * GET /api/users/stats
   * Required Permission: VIEW_USER_STATS
   */
  async getUserStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const allUsers = await userService.getAllUsers({ limit: 1000 });
      const users = allUsers.users;

      const stats = {
        total: users.length,
        active: users.filter((user) => user.isActive).length,
        inactive: users.filter((user) => !user.isActive).length,
        byRole: {
          admin: users.filter((user) => user.role === UserRole.ADMIN).length,
          contributor: users.filter(
            (user) => user.role === UserRole.CONTRIBUTOR
          ).length,
          groupLeader: users.filter(
            (user) => user.role === UserRole.GROUP_LEADER
          ).length,
          subscriber: users.filter((user) => user.role === UserRole.SUBSCRIBER)
            .length,
        },
        bySignInType: {
          withPassword: users.filter(
            (user) => user.signInType === 'withPassword'
          ).length,
          passwordless: users.filter(
            (user) => user.signInType === 'passwordless'
          ).length,
          microsoftEntraID: users.filter(
            (user) => user.signInType === 'microsoftEntraID'
          ).length,
        },
        byInvitationStatus: {
          none: users.filter((user) => user.invitationStatus === 'none').length,
          pending: users.filter((user) => user.invitationStatus === 'pending')
            .length,
          sent: users.filter((user) => user.invitationStatus === 'sent').length,
          accepted: users.filter((user) => user.invitationStatus === 'accepted')
            .length,
          expired: users.filter((user) => user.invitationStatus === 'expired')
            .length,
        },
        microsoftUsers: {
          total: users.filter((user) => user.signInType === 'microsoftEntraID')
            .length,
          canSignIn: users.filter(
            (user) => user.signInType === 'microsoftEntraID' && user.canSignIn
          ).length,
          pendingInvitation: users.filter(
            (user) =>
              user.signInType === 'microsoftEntraID' && user.isInvitationPending
          ).length,
        },
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
          canCreate: RBACService.getCreatableRoles(req.user!.role),
          permissions: RBACService.getRolePermissions(req.user!.role),
        },
      };

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's permissions and creatable roles
   * GET /api/users/me/permissions
   * Required: Authentication only
   */
  async getCurrentUserPermissions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userPermissions = {
        user: {
          id: req.user!.id,
          role: req.user!.role,
          email: req.user!.email,
          firstName: req.user!.firstName,
          lastName: req.user!.lastName,
          isActive: req.user!.isActive,
        },
        permissions: RBACService.getRolePermissions(req.user!.role),
        creatableRoles: RBACService.getCreatableRoles(req.user!.role),
        roleHierarchy: {
          currentLevel: req.user!.role,
          canManage: Object.values(UserRole).filter((role) =>
            RBACService.canManageUser(req.user!.role, role)
          ),
        },
      };

      res.status(200).json({
        success: true,
        data: userPermissions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * UPDATED: Test email functionality with connection test
   * POST /api/users/test-email
   */
  async testEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, type } = req.body;

      if (!email) {
        throw new AppError('Email is required', 400);
      }

      let result;

      // Test different email types
      switch (type) {
        case 'otp':
          // Test existing OTP email
          result = await emailService.sendOTPEmail(email, '123456', 'verify');
          break;

        case 'microsoft':
          // Test Microsoft invitation email
          result = await emailService.sendMicrosoftInvitationEmail(
            email,
            'Test User',
            'https://example.com/test-invitation',
            'Test Organization'
          );
          break;

        case 'generic':
        default:
          // Test generic email
          result = await emailService.sendEmail(
            email,
            'Test Email from LMS System',
            `
            <h2>Email Test Successful!</h2>
            <p>This is a test email to verify that your email service is working correctly.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>✅ Your email service configuration is working!</strong></p>
            </div>
          `
          );
          break;
      }

      res.status(200).json({
        success: true,
        message: `Test email sent successfully (type: ${type || 'generic'})`,
        data: {
          messageId: result.messageId,
          response: result.response,
        },
      });
    } catch (error: any) {
      console.error('Test email failed:', error);
      res.status(500).json({
        success: false,
        error: `Failed to send test email: ${error.message}`,
        details: {
          code: error.code,
          command: error.command,
        },
      });
    }
  }

  /**
   * ADDED: Test email service connection
   * GET /api/users/test-email-connection
   */
  async testEmailConnection(req: Request, res: Response) {
    try {
      const isConnected = await emailService.testConnection();

      res.json({
        success: true,
        data: {
          connected: isConnected,
          timestamp: new Date().toISOString(),
          smtpConfig: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            user: process.env.SMTP_USER ? '***configured***' : 'NOT_SET',
            from: process.env.SMTP_FROM,
          },
        },
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Test Redis functionality
   * GET /api/users/test-redis
   */
  async testRedis(req: Request, res: Response) {
    try {
      const testKey = 'test-key';
      const testValue = JSON.stringify({ test: 'data', timestamp: Date.now() });

      // Set value
      await redis.set(testKey, testValue, { EX: 60 });

      // Get value
      const retrieved = await redis.get(testKey);

      res.json({
        success: true,
        data: {
          stored: testValue,
          retrieved: retrieved,
          redisWorking: !!retrieved,
        },
      });
    } catch (error: any) {
      res.json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Helper method to get Graph API access token
   */
  private async getGraphAccessToken() {
    try {
      const tokenResponse = await axios.post(
        `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: process.env.AZURE_CLIENT_ID!,
          client_secret: process.env.AZURE_CLIENT_SECRET!,
          grant_type: 'client_credentials',
          scope: 'https://graph.microsoft.com/.default',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );
      return tokenResponse.data.access_token;
    } catch (error) {
      console.error('Graph access token error:', error);
      throw new AppError('Failed to obtain Graph API token', 500);
    }
  }

  /**
   * Helper method to invite guest user to Microsoft tenant
   */
  private async inviteGuestUserhelper(email: string) {
    try {
      if (!email) throw new AppError('Email is required', 400);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        throw new AppError('Invalid email format', 400);

      const accessToken = await this.getGraphAccessToken();
      const invitePayload = {
        invitedUserEmailAddress: email,
        inviteRedirectUrl:
          process.env.AZURE_REDIRECT_URI ||
          process.env.FRONTEND_URL + '/auth/microsoft/callback',
        sendInvitationMessage: true,
      };

      const response = await axios
        .post('https://graph.microsoft.com/v1.0/invitations', invitePayload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })
        .catch((err) => {
          console.error('Guest invitation API error:', {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message,
          });
          if (err.response?.status === 403) {
            throw new AppError(
              'Insufficient permissions for guest invitation. Ensure User.Invite.All is granted.',
              403
            );
          }
          throw err;
        });

      return response.data;
    } catch (error) {
      console.error('Guest invitation error:', error);
      throw error instanceof AppError
        ? error
        : new AppError('Failed to send guest invitation', 500);
    }
  }

  /**
   * Manual guest user invitation endpoint (for testing/admin use)
   * POST /api/users/invite-guest
   * Required Permission: CREATE_USER
   */
  async inviteGuestUser(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = req.body;
      const result = await this.inviteGuestUserhelper(email);

      res.status(200).json({
        success: true,
        data: { invitedUser: result },
        message: 'Guest invitation sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const userController = new UserController();

// Export middleware for route protection
export {
  authenticate,
  requirePermission,
  requireRoleCreationPermission,
  requireUserManagementPermission,
  requireRole,
  requireSelfOrPermission,
  PERMISSIONS,
  UserRole,
};
