import { UserRole } from '../../middleware/authenticator';

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  signInType: 'withPassword' | 'passwordless' | 'microsoftEntraID';
  isActive?: boolean;
  invitationStatus?: 'none' | 'pending' | 'sent' | 'accepted' | 'expired';
  microsoftUserId?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  signInType?: 'withPassword' | 'passwordless' | 'microsoftEntraID';
  isActive?: boolean;
  invitationStatus?: 'none' | 'pending' | 'sent' | 'accepted' | 'expired';
  invitationSentAt?: Date | null;
  invitationAcceptedAt?: Date | null;
  microsoftUserId?: string | null;
}

export interface UserFilters {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  invitationStatus?: 'none' | 'pending' | 'sent' | 'accepted' | 'expired';
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  signInType: 'withPassword' | 'passwordless' | 'microsoftEntraID';
  isActive: boolean;
  invitationStatus: 'none' | 'pending' | 'sent' | 'accepted' | 'expired';
  invitationSentAt: Date | null;
  invitationAcceptedAt: Date | null;
  microsoftUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Helper properties for frontend
  canSignIn: boolean;
  isInvitationPending: boolean;
  needsInvitationAcceptance: boolean;
}

export interface MicrosoftSignupData {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

// Updated to use the initiate result for the userService
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
}