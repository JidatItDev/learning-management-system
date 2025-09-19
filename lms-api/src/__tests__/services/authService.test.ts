import { authService } from '../../services/authService/authService';
import axios from 'axios';
import User from '../../models/users/users';
import Token from '../../models/tokens/tokens';
import { userService } from '../../services/userService';
import { AppError } from '../../middleware/errorHandler';
import { UserRole } from '../../middleware/authenticator';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('axios');
jest.mock('../../models/users/users');
jest.mock('../../models/tokens/tokens');
jest.mock('../../services/userService');
jest.mock('jsonwebtoken');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedUser = User as jest.Mocked<typeof User>;
const mockedToken = Token as jest.Mocked<typeof Token>;
const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService - microsoftLogin', () => {
  const mockCode = 'mock-authorization-code';
  const mockAccessToken = 'mock-access-token';
  const mockUserInfo = {
    givenName: 'John',
    surname: 'Doe',
    mail: 'john.doe@example.com',
    userPrincipalName: 'john.doe@tenant.com',
    id: 'ms-user-id',
  };
  const mockUser = {
    id: 'user-123',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'subscriber' as UserRole,
    signInType: 'microsoftEntraID',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to suppress error logs during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock axios.post for token exchange
    mockedAxios.post.mockResolvedValue({
      data: { access_token: mockAccessToken },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token` },
    });
    // Mock axios.get for user info
    mockedAxios.get.mockResolvedValue({
      data: mockUserInfo,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: 'https://graph.microsoft.com/v1.0/me' },
    });
    // Mock jwt.sign for token generation
    mockedJwt.sign
      .mockReturnValueOnce('mock-access-token' as any)
      .mockReturnValueOnce('mock-refresh-token' as any);
  });

  it('should return access token, refresh token, and user data for new user', async () => {
    // Arrange
    mockedUser.findOne.mockResolvedValue(null); // No existing user
    mockedUserService.createUser.mockResolvedValue(mockUser);
    mockedToken.create.mockResolvedValue({} as any);

    // Act
    const response = await authService.microsoftLogin(mockCode);

    // Assert
    expect(mockedAxios.post).toHaveBeenCalledWith(
      `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
      expect.any(URLSearchParams),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://graph.microsoft.com/v1.0/me',
      { headers: { Authorization: `Bearer ${mockAccessToken}` } }
    );
    expect(mockedUser.findOne).toHaveBeenCalledWith({
      where: { email: mockUserInfo.mail.toLowerCase().trim() },
    });
    expect(mockedUserService.createUser).toHaveBeenCalledWith({
      firstName: mockUserInfo.givenName,
      lastName: mockUserInfo.surname,
      email: mockUserInfo.mail.toLowerCase().trim(),
      role: 'subscriber',
      signInType: 'microsoftEntraID',
      isActive: true,
    });
    expect(mockedToken.create).toHaveBeenCalledWith({
      userId: mockUser.id,
      token: 'mock-refresh-token',
      expiresAt: expect.any(Date),
    });
    expect(mockedJwt.sign).toHaveBeenCalledTimes(2);
    expect(response).toEqual({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        isActive: mockUser.isActive,
      },
    });
  });

  it('should return access token, refresh token, and user data for existing user', async () => {
    // Arrange
    mockedUser.findOne.mockResolvedValue(mockUser as any);
    mockedToken.create.mockResolvedValue({} as any);

    // Act
    const response = await authService.microsoftLogin(mockCode);

    // Assert
    expect(mockedUser.findOne).toHaveBeenCalledWith({
      where: { email: mockUserInfo.mail.toLowerCase().trim() },
    });
    expect(mockedUserService.createUser).not.toHaveBeenCalled();
    expect(mockedToken.create).toHaveBeenCalledWith({
      userId: mockUser.id,
      token: 'mock-refresh-token',
      expiresAt: expect.any(Date),
    });
    expect(response).toEqual({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        isActive: mockUser.isActive,
      },
    });
  });

  it('should throw error if no valid email is found', async () => {
    // Arrange
    mockedAxios.get.mockResolvedValue({
      data: { givenName: 'John', surname: 'Doe' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url: 'https://graph.microsoft.com/v1.0/me' },
    });
    mockedUser.findOne.mockResolvedValue(null);

    // Act & Assert
    await expect(authService.microsoftLogin(mockCode)).rejects.toThrow(
      new AppError('No valid email found in Microsoft profile', 400)
    );
    expect(mockedUserService.createUser).not.toHaveBeenCalled();
    expect(mockedToken.create).not.toHaveBeenCalled();
  });

  it('should throw error if user exists with different sign-in type', async () => {
    // Arrange
    const existingUser = {
      ...mockUser,
      signInType: 'withPassword',
    };
    mockedUser.findOne.mockResolvedValue(existingUser as any);

    // Act & Assert
    await expect(authService.microsoftLogin(mockCode)).rejects.toThrow(
      new AppError('User exists with a different sign-in type', 400)
    );
    expect(mockedUserService.createUser).not.toHaveBeenCalled();
    expect(mockedToken.create).not.toHaveBeenCalled();
  });

  it('should throw error if user is deactivated', async () => {
    // Arrange
    const deactivatedUser = {
      ...mockUser,
      isActive: false,
    };
    mockedUser.findOne.mockResolvedValue(deactivatedUser as any);

    // Act & Assert
    await expect(authService.microsoftLogin(mockCode)).rejects.toThrow(
      new AppError('Account is deactivated', 403)
    );
    expect(mockedUserService.createUser).not.toHaveBeenCalled();
    expect(mockedToken.create).not.toHaveBeenCalled();
  });

  it('should throw error if Microsoft Entra ID configuration is missing', async () => {
    // Arrange
    const originalEnv = { ...process.env };
    delete process.env.AZURE_CLIENT_ID;

    // Act & Assert
    await expect(authService.microsoftLogin(mockCode)).rejects.toThrow(
      new AppError('Microsoft Entra ID configuration is missing', 500)
    );

    // Cleanup
    process.env = originalEnv;
  });

  it('should handle Microsoft API errors', async () => {
    // Arrange
    mockedAxios.post.mockRejectedValue(new Error('Microsoft API error'));

    // Act & Assert
    await expect(authService.microsoftLogin(mockCode)).rejects.toThrow(
      new AppError('Microsoft Entra ID login failed', 401)
    );
    expect(mockedUser.findOne).not.toHaveBeenCalled();
    expect(mockedUserService.createUser).not.toHaveBeenCalled();
    expect(mockedToken.create).not.toHaveBeenCalled();
  });
});