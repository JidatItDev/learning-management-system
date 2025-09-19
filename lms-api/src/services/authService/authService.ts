// Fix the jwtDecode import at the top of your authService.ts file
import { jwtDecode } from 'jwt-decode'; // Changed from require to ES6 import
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { User, Token } from '../../models';
import { AppError } from '../../middleware/errorHandler';
import { UserRole } from '../../middleware/authenticator';
import { CreateUserData, userService } from '../userService';
import {
  LoginData,
  MicrosoftGraphUserInfo,
  MicrosoftLoginResult,
  TokenPayload,
  PasswordlessInitiateData,
  PasswordlessVerifyData,
  MicrosoftSignupResult,
} from './auth.interface';
import { isTokenPayload } from '../../utils/isTokenPayload';
import sequelize from '../../config/database';
import { otpService } from '../otpService/otpService';
import redis from '../../config/redis';
import axios from 'axios';
import crypto from 'crypto';

export class AuthService {
  private readonly ACCESS_TOKEN_SECRET: string;
  private readonly REFRESH_TOKEN_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY: string;
  private readonly REFRESH_TOKEN_EXPIRY: string;

  constructor() {
    if (
      !process.env.JWT_ACCESS_SECRET ||
      !process.env.JWT_REFRESH_SECRET ||
      !process.env.JWT_ACCESS_EXPIRY ||
      !process.env.JWT_REFRESH_EXPIRY
    ) {
      throw new Error('JWT secrets are not defined in environment variables');
    }

    this.ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
    this.REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;
    this.ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY;
    this.REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY;
  }

  /**
   * Login user and generate access/refresh tokens
   */
/**
 * Login user and generate access/refresh tokens
 * Fixed version with token cleanup
 */
async login(data: LoginData) {
  try {
    const { email, password } = data;

    // Find user by email
    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isActive === false) {
      throw new AppError('Account is deactivated', 403);
    }

    // Check if Microsoft user can sign in
    if (user.signInType === 'microsoftEntraID') {
      if (!user.canSignIn()) {
        throw new AppError('Microsoft account invitation not accepted. Use Microsoft Entra ID to complete signup.', 401);
      }
      throw new AppError('Use Microsoft Entra ID to log in', 401);
    }

    // Only verify password for users with password-based authentication
    if (user.signInType === 'withPassword') {
      // Check if user has a password set
      if (!user.password) {
        throw new AppError('Password not set for this account', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }
    } else if (user.signInType === 'passwordless') {
      throw new AppError('Use passwordless login for this account', 401);
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Clean up any existing refresh tokens for this user before creating new one
    await Token.destroy({
      where: { userId: user.id }
    });

    // Store refresh token in database
    try {
      await Token.create({
        userId: user?.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    } catch (error: Error | any) {
      console.error('Error storing refresh token:', error);
      
      // If it's still a duplicate error, try one more cleanup and retry
      if (error.name === 'SequelizeUniqueConstraintError') {
        try {
          await Token.destroy({ where: { token: refreshToken } });
          await Token.create({
            userId: user?.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
        } catch (retryError) {
          console.error('Token retry creation error:', retryError);
          throw new AppError('Failed to store refresh token after cleanup', 500);
        }
      } else {
        throw new AppError('Failed to store refresh token', 500);
      }
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user?.id,
        email: user?.email,
        role: user?.role as UserRole,
        firstName: user?.firstName,
        lastName: user?.lastName,
        isActive: user?.isActive,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to login', 500);
  }
}

  /**
   * Initiate passwordless login by sending OTP
   */
  async initiatePasswordlessLogin(data: PasswordlessInitiateData) {
    try {
      const { email } = data;

      // Find user by email
      const user = await User.findOne({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.isActive === false) {
        throw new AppError('Account is deactivated', 403);
      }

      // Check if Microsoft user can sign in
      if (user.signInType === 'microsoftEntraID') {
        if (!user.canSignIn()) {
          throw new AppError(
            'Microsoft account invitation not accepted. Complete signup first.',
            403
          );
        }
        throw new AppError('Use Microsoft Entra ID to log in', 401);
      }

      if (user.signInType !== 'passwordless') {
        return {
          userId: user.id,
          role: user.role,
          signInType: user.signInType,
        };
      }

      // Generate and send OTP
      const result = await otpService.generateAndSendOTP(
        user.id,
        user.email,
        'verify'
      );

      return {
        message: result.message,
        userId: user.id,
        role: user.role,
        signInType: user.signInType,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to initiate passwordless login', 500);
    }
  }

  /**
   * Verify OTP and complete passwordless login
   */
/**
 * Verify OTP and complete passwordless login
 * Fixed version with token cleanup
 */
async verifyPasswordlessLogin(data: PasswordlessVerifyData) {
  try {
    const { userId, otp } = data;

    // Find user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isActive === false) {
      throw new AppError('Account is deactivated', 403);
    }

    if (user.signInType !== 'passwordless') {
      throw new AppError(
        'User is not configured for passwordless authentication',
        400
      );
    }

    // Verify OTP
    await otpService.verifyOTP(userId, otp);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Clean up any existing refresh tokens for this user before creating new one
    await Token.destroy({
      where: { userId: user.id }
    });

    // Store refresh token in database
    try {
      await Token.create({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    } catch (error: Error | any) {
      console.error('Error storing refresh token:', error);
      
      // If it's still a duplicate error, try one more cleanup and retry
      if (error.name === 'SequelizeUniqueConstraintError') {
        try {
          await Token.destroy({ where: { token: refreshToken } });
          await Token.create({
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
        } catch (retryError) {
          console.error('Token retry creation error:', retryError);
          throw new AppError('Failed to store refresh token after cleanup', 500);
        }
      } else {
        throw new AppError('Failed to store refresh token', 500);
      }
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to verify passwordless login', 500);
  }
}

// Key fixes in AuthService:
// 1. Use correct redirect URI for signup vs login
// 2. Better error handling for token exchange
// 3. Proper environment variable validation

/**
 * Complete Microsoft signup process
 * FIXED: Use SIGNUP redirect URI for token exchange
 */
async completeMicrosoftSignup(
  code: string,
  state: string
): Promise<MicrosoftSignupResult> {
  try {
    // Retrieve signup data from Redis
    let signupData;
    try {
      const storedData = await redis.get(`microsoft-signup:${state}`);
      if (!storedData) {
        throw new AppError('Invalid or expired signup state', 400);
      }
      signupData = JSON.parse(storedData);
    } catch (error) {
      console.error('Redis get error:', error);
      throw new AppError('Invalid or expired signup state', 400);
    }

    // FIXED: Use SIGNUP redirect URI for token exchange
    const redirectUri = process.env.AZURE_SIGNUP_REDIRECT_URI;
    
    if (!redirectUri) {
      throw new AppError('AZURE_SIGNUP_REDIRECT_URI is not configured', 500);
    }

    console.log('Using signup redirect URI:', redirectUri);

    // Exchange code for tokens using SIGNUP redirect URI
    const tokenResponse = await axios
      .post(
        `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: process.env.AZURE_CLIENT_ID!,
          client_secret: process.env.AZURE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri, // FIXED: Use signup redirect URI
          scope: 'openid profile email User.Read',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      )
      .catch((err) => {
        console.error('Token exchange error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
          redirectUri: redirectUri, // Log which redirect URI was used
        });
        
        if (err.response?.data?.error === 'invalid_grant') {
          throw new AppError(
            'Invalid authorization code or redirect URI mismatch. Please ensure AZURE_SIGNUP_REDIRECT_URI is correctly configured in both Azure AD and environment variables.',
            400
          );
        }
        throw new AppError('Failed to exchange authorization code', 400);
      });

    const { access_token, id_token } = tokenResponse.data;

    // Get user info from Microsoft
    let userInfo: any;
    try {
      userInfo = jwtDecode(id_token);
    } catch (error) {
      // Fallback to Graph API
      const graphResponse = await axios.get(
        'https://graph.microsoft.com/v1.0/me',
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
      userInfo = graphResponse.data;
    }

    const email =
      userInfo.mail ||
      userInfo.userPrincipalName ||
      userInfo.email ||
      userInfo.upn;

    // Verify email matches the signup data
    if (
      email?.toLowerCase().trim() !== signupData.email.toLowerCase().trim()
    ) {
      throw new AppError(
        'Microsoft account email does not match signup email',
        400
      );
    }

    // Update user with Microsoft details and activate
    const user = await User.findByPk(signupData.userId);
    if (!user) {
      throw new AppError('Signup user not found', 404);
    }

    await user.update({
      invitationStatus: 'accepted',
      invitationAcceptedAt: new Date(),
      isActive: true,
      microsoftUserId: userInfo.id || userInfo.oid,
      // Optionally update names from Microsoft profile
      firstName: userInfo.givenName || userInfo.given_name || user.firstName,
      lastName: userInfo.surname || userInfo.family_name || user.lastName,
    });

    // Clean up Redis state
    await redis.del(`microsoft-signup:${state}`);

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await Token.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        invitationStatus: 'accepted',
        canSignIn: true,
      },
      invitationSent: true,
      authorizationUrl: '',
      message: 'Microsoft signup completed successfully',
      state: '',
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error('Complete Microsoft signup error:', error);
    throw new AppError('Failed to complete Microsoft signup', 500);
  }
}

/**
 * Initiate Microsoft Entra ID login - Manual OAuth2 implementation
 * FIXED: Accept and use state parameter properly
 */
async initiateMicrosoftLogin(state?: string) {
  try {
    if (
      !process.env.AZURE_CLIENT_ID ||
      !process.env.AZURE_TENANT_ID
    ) {
      throw new AppError('Microsoft Entra ID configuration is missing', 500);
    }

    // FIXED: Choose redirect URI based on whether state is provided
    let redirectUri: string;
    
    if (state) {
      // This is for signup flow
      redirectUri = process.env.AZURE_SIGNUP_REDIRECT_URI!;
      if (!redirectUri) {
        throw new AppError('AZURE_SIGNUP_REDIRECT_URI is not configured', 500);
      }
    } else {
      // This is for login flow
      redirectUri = process.env.AZURE_LOGIN_REDIRECT_URI!;
      if (!redirectUri) {
        throw new AppError('AZURE_LOGIN_REDIRECT_URI is not configured', 500);
      }
    }

    console.log('Using redirect URI:', redirectUri, state ? '(signup)' : '(login)');

    const authParams = new URLSearchParams({
      client_id: process.env.AZURE_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid profile email User.Read',
      response_mode: 'query',
      ...(state && { state }),
    });

    const authorizationUrl = `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/authorize?${authParams.toString()}`;
    return { authorizationUrl };
  } catch (error) {
    console.error('Initiate Microsoft login error:', error);
    throw new AppError('Failed to initiate Microsoft login', 500);
  }
}

/**
 * Microsoft login callback - Manual OAuth2 implementation
 * FIXED: Use LOGIN redirect URI for regular login
 */
async microsoftLogin(code: string): Promise<MicrosoftLoginResult> {
  try {
    // FIXED: Use LOGIN redirect URI for token exchange
    const redirectUri = process.env.AZURE_LOGIN_REDIRECT_URI;
    
    if (!redirectUri) {
      throw new AppError('AZURE_LOGIN_REDIRECT_URI is not configured', 500);
    }

    console.log('Using login redirect URI:', redirectUri);

    const tokenResponse = await axios
      .post(
        `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: process.env.AZURE_CLIENT_ID!,
          client_secret: process.env.AZURE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri, // FIXED: Use login redirect URI
          scope: 'openid profile email User.Read',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      )
      .catch((err) => {
        console.error('Token exchange error:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
          redirectUri: redirectUri, // Log which redirect URI was used
        });
        if (err.response?.data?.error === 'invalid_grant') {
          throw new AppError(
            'Invalid authorization code or redirect URI mismatch. Please ensure AZURE_LOGIN_REDIRECT_URI is correctly configured.',
            400
          );
        }
        throw err;
      });

    // ... rest of the existing microsoftLogin method remains the same
    
    const { access_token, id_token, refresh_token } = tokenResponse.data;

    let userInfo: any;
    try {
      userInfo = jwtDecode(id_token);
    } catch (error) {
      console.warn('id_token decode failed:', error);
      // Proceed to Graph API
    }

    // Use Graph API if id_token lacks email/upn or decoding failed
    if (!userInfo || (!userInfo.email && !userInfo.upn)) {
      const graphResponse = await axios
        .get('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${access_token}` },
        })
        .catch((err) => {
          console.error('Graph API error:', {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message,
          });
          if (err.response?.status === 403) {
            throw new AppError(
              'Insufficient permissions for Graph API. Ensure User.Read is granted.',
              403
            );
          }
          throw err;
        });
      userInfo = graphResponse.data;
    }

    const email =
      userInfo.mail ||
      userInfo.userPrincipalName ||
      userInfo.email ||
      userInfo.upn;
    if (!email) {
      console.error('No valid email found in userInfo:', userInfo);
      throw new AppError('No valid email found in Microsoft profile', 400);
    }

    let user = await User.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new AppError(
        'User not found. Please contact administrator to create your account first.',
        404
      );
    }

    if (user?.signInType !== 'microsoftEntraID') {
      console.error(
        'User exists with different sign-in type:',
        user.signInType
      );
      throw new AppError(
        'This account is not configured for Microsoft login',
        400
      );
    }

    // If user exists but invitation not accepted, update status
    if (
      user?.signInType === 'microsoftEntraID' &&
      !user.isInvitationAccepted()
    ) {
      await User.update(
        {
          invitationStatus: 'accepted',
          invitationAcceptedAt: new Date(),
          isActive: true,
          microsoftUserId: userInfo.id || userInfo.oid,
        },
        { where: { id: user.id } }
      );

      // Refresh user data
      const updatedUser = await User.findByPk(user.id);
      if (updatedUser) {
        user = updatedUser;
      }
    }

    if (!user?.canSignIn()) {
      console.error('User cannot sign in:', {
        email,
        isActive: user?.isActive,
        invitationStatus: user?.invitationStatus,
        canSignIn: user?.canSignIn(),
      });
      throw new AppError('Account cannot be accessed', 403);
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Clean up any existing tokens for this user first
    await Token.destroy({ where: { userId: user.id } });

    // Create new token
    await Token.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }).catch((err) => {
      console.error('Token creation error:', err);
      throw new AppError('Failed to store refresh token', 500);
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        invitationStatus: user.invitationStatus,
        canSignIn: user.canSignIn(),
      },
    };
  } catch (error: any) {
    console.error('Microsoft login error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack,
    });
    if (error.response?.data?.error_description?.includes('AADSTS50034')) {
      throw new AppError('User does not exist in tenant', 403);
    }
    throw error instanceof AppError
      ? error
      : new AppError('Microsoft login failed', 401);
  }
}

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      let payload: TokenPayload;
      try {
        const decoded = jwt.verify(refreshToken, this.REFRESH_TOKEN_SECRET);

        if (!isTokenPayload(decoded)) {
          throw new AppError('Invalid or malformed token payload', 401);
        }

        payload = decoded;
      } catch (error) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Check if token exists in database
      const storedToken = await Token.findOne({
        where: {
          token: refreshToken,
          userId: payload.id,
          expiresAt: { [Op.gt]: new Date() },
        },
      });

      if (!storedToken) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Verify user exists and is active
      const user = await User.findByPk(payload.id);
      if (!user || !user.isActive) {
        throw new AppError('User not found or account is deactivated', 403);
      }

      // For Microsoft users, ensure they can still sign in
      if (user.signInType === 'microsoftEntraID' && !user.canSignIn()) {
        throw new AppError('Microsoft account invitation not accepted', 403);
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      return { accessToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to refresh token', 500);
    }
  }

  /**
   * Revoke a refresh token (logout)
   */
  async revokeToken(refreshToken: string) {
    try {
      const token = await Token.findOne({ where: { token: refreshToken } });
      if (token) {
        await token.destroy();
      }
      return { message: 'Token revoked successfully' };
    } catch (error) {
      throw new AppError('Failed to revoke token', 500);
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    try {
      await Token.destroy({
        where: {
          expiresAt: { [Op.lt]: new Date() },
        },
      });
    } catch (error) {
      throw new AppError('Failed to clean up expired tokens', 500);
    }
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      throw new AppError('Failed to hash password', 500);
    }
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new AppError('Failed to compare password', 500);
    }
  }

  /**
   * Generate access token
   */
  public generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      invitationStatus: user.invitationStatus,
      jti: crypto.randomUUID(), // NEW: Makes tokens unique
    };
    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  public generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      invitationStatus: user.invitationStatus,
      jti: crypto.randomUUID(), // NEW: Makes tokens unique
    };
    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    } as jwt.SignOptions);
  }

  /**
   * Set user password after OTP verification
   */
  async setUserPassword(userId: string, password: string) {
    const transaction = await sequelize.transaction();
    try {
      const user = await User.findByPk(userId, { transaction });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.signInType !== 'withPassword') {
        throw new AppError(
          'User is not configured for password-based authentication',
          400
        );
      }

      const hashedPassword = await this.hashPassword(password);
      await user.update({ password: hashedPassword }, { transaction });

      await transaction.commit();
      return { message: 'Password set successfully' };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to set password', 500);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();