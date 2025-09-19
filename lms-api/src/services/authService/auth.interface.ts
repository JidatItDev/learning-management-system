import { UserRole } from '../../middleware/authenticator';

export interface LoginData {
  email: string;
  password: string;
}

export interface PasswordlessInitiateData {
  email: string;
}

export interface PasswordlessVerifyData {
  userId: string;
  otp: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  invitationStatus?: 'none' | 'pending' | 'sent' | 'accepted' | 'expired';
  jti?: string;
}

export interface MicrosoftGraphUserInfo {
  givenName?: string;
  surname?: string;
  mail?: string;
  userPrincipalName?: string;
  id?: string;
  displayName?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  upn?: string;
}

export interface MicrosoftUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  isActive: boolean;
  invitationStatus: 'none' | 'pending' | 'sent' | 'accepted' | 'expired';
  canSignIn: boolean;
}

export interface MicrosoftLoginResult {
  user: MicrosoftUser;
  accessToken: string;
  refreshToken: string;
}

export interface MicrosoftSignupInitiateData {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

// For initiating Microsoft signup - no tokens yet
export interface MicrosoftSignupInitiateResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    invitationStatus: string;
    canSignIn: boolean;
  };
  invitationSent: boolean;
  authorizationUrl: string;
  message: string;
  state: string;
}

// For completed Microsoft signup - includes tokens
export interface MicrosoftSignupResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    invitationStatus: string;
    canSignIn: boolean;
  };
  invitationSent: boolean;
  authorizationUrl: string;
  message: string;
  state: string;
  accessToken: string;
  refreshToken: string;
}

export interface PasswordlessLoginResult {
  user: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
  accessToken: string;
  refreshToken: string;
}