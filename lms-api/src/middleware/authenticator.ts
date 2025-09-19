import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/errorHandler';
import User from '../models/users/users';

// Define user roles with hierarchy levels
export enum UserRole {
  ADMIN = 'admin',
  CONTRIBUTOR = 'contributor',
  GROUP_LEADER = 'groupLeader',
  SUBSCRIBER = 'subscriber',
}

// Define role hierarchy (higher number = higher privilege)
export const ROLE_HIERARCHY = {
  [UserRole.ADMIN]: 4,
  [UserRole.CONTRIBUTOR]: 3,
  [UserRole.GROUP_LEADER]: 2,
  [UserRole.SUBSCRIBER]: 1,
} as const;

// Define what roles each role can create
export const ROLE_CREATION_PERMISSIONS: Record<UserRole, UserRole[]> = {
  [UserRole.ADMIN]: [
    UserRole.CONTRIBUTOR,
    UserRole.GROUP_LEADER,
    UserRole.SUBSCRIBER,
  ],
  [UserRole.CONTRIBUTOR]: [UserRole.GROUP_LEADER, UserRole.SUBSCRIBER],
  [UserRole.GROUP_LEADER]: [UserRole.SUBSCRIBER],
  [UserRole.SUBSCRIBER]: [],
};

// Define permissions for different operations
export const PERMISSIONS = {
  // User management permissions
  CREATE_USER: 'create_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  VIEW_USER: 'view_user',
  LIST_USERS: 'list_users',
  TOGGLE_USER_STATUS: 'toggle_user_status',
  CREATE_ADMIN: 'create_admin',
  CREATE_CONTRIBUTOR: 'create_contributor',
  CREATE_GROUP_LEADER: 'create_group_leader',
  CREATE_SUBSCRIBER: 'create_subscriber',
  VIEW_USER_GROUPS: 'view_user_groups',
  MANAGE_GROUPS: 'manage_groups',
  VIEW_USER_STATS: 'view_user_stats',
  BULK_CREATE_USERS: 'bulk_create_users',
  // Company management permissions
  CREATE_COMPANY: 'create_company',
  UPDATE_COMPANY: 'update_company',
  DELETE_COMPANY: 'delete_company',
  VIEW_COMPANY: 'view_company',
  LIST_COMPANIES: 'list_companies',
  // Group management permissions
  CREATE_GROUP: 'create_group',
  UPDATE_GROUP: 'update_group',
  DELETE_GROUP: 'delete_group',
  VIEW_GROUP: 'view_group',
  LIST_GROUPS: 'list_groups',
  TOGGLE_GROUP_STATUS: 'toggle_group_status',
  ADD_GROUP_MEMBER: 'add_group_member',
  REMOVE_GROUP_MEMBER: 'remove_group_member',
  // OTP and password reset permissions
  VERIFY_OTP: 'verify_otp',
  SET_PASSWORD: 'set_password',
  REQUEST_PASSWORD_RESET: 'request_password_reset',
  RESEND_OTP: 'resend_otp',
  // Course management permissions
  CREATE_COURSE: 'create_course',
  UPDATE_COURSE: 'update_course',
  DELETE_COURSE: 'delete_course',
  VIEW_COURSE: 'view_course',
  LIST_COURSES: 'list_courses',
  UPDATE_OWN_COURSE: 'update_own_course',
  DELETE_OWN_COURSE: 'delete_own_course',
  // Email template management permissions
  CREATE_EMAIL_TEMPLATE: 'create_email_template',
  UPDATE_EMAIL_TEMPLATE: 'update_email_template',
  DELETE_EMAIL_TEMPLATE: 'delete_email_template',
  VIEW_EMAIL_TEMPLATE: 'view_email_template',
  LIST_EMAIL_TEMPLATES: 'list_email_templates',
  TOGGLE_EMAIL_TEMPLATE_STATUS: 'toggle_email_template_status',
  RENDER_EMAIL_TEMPLATE: 'render_email_template',
  VIEW_EMAIL_TEMPLATE_STATS: 'view_email_template_stats',
  // Scheduled email management permissions
  CREATE_SCHEDULE_EMAIL: 'create_schedule_email',
  UPDATE_SCHEDULE_EMAIL: 'update_schedule_email',
  DELETE_SCHEDULE_EMAIL: 'delete_schedule_email',
  VIEW_SCHEDULE_EMAIL: 'view_schedule_email',
  LIST_SCHEDULE_EMAILS: 'list_schedule_emails',
  CANCEL_SCHEDULE_EMAIL: 'cancel_schedule_email',
} as const;

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    // User management permissions
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.DELETE_USER,
    PERMISSIONS.VIEW_USER,
    PERMISSIONS.LIST_USERS,
    PERMISSIONS.TOGGLE_USER_STATUS,
    PERMISSIONS.CREATE_ADMIN,
    PERMISSIONS.CREATE_CONTRIBUTOR,
    PERMISSIONS.CREATE_GROUP_LEADER,
    PERMISSIONS.CREATE_SUBSCRIBER,
    PERMISSIONS.VIEW_USER_GROUPS,
    PERMISSIONS.MANAGE_GROUPS,
    PERMISSIONS.VIEW_USER_STATS,
    PERMISSIONS.BULK_CREATE_USERS,
    // Company management permissions
    PERMISSIONS.CREATE_COMPANY,
    PERMISSIONS.UPDATE_COMPANY,
    PERMISSIONS.DELETE_COMPANY,
    PERMISSIONS.VIEW_COMPANY,
    PERMISSIONS.LIST_COMPANIES,
    // Group management permissions
    PERMISSIONS.CREATE_GROUP,
    PERMISSIONS.UPDATE_GROUP,
    PERMISSIONS.DELETE_GROUP,
    PERMISSIONS.VIEW_GROUP,
    PERMISSIONS.LIST_GROUPS,
    PERMISSIONS.TOGGLE_GROUP_STATUS,
    PERMISSIONS.ADD_GROUP_MEMBER,
    PERMISSIONS.REMOVE_GROUP_MEMBER,
    // OTP and password reset permissions
    PERMISSIONS.VERIFY_OTP,
    PERMISSIONS.SET_PASSWORD,
    PERMISSIONS.REQUEST_PASSWORD_RESET,
    PERMISSIONS.RESEND_OTP,
    // Course management permissions - Admin has full access
    PERMISSIONS.CREATE_COURSE,
    PERMISSIONS.UPDATE_COURSE,
    PERMISSIONS.DELETE_COURSE,
    PERMISSIONS.VIEW_COURSE,
    PERMISSIONS.LIST_COURSES,
    PERMISSIONS.UPDATE_OWN_COURSE,
    PERMISSIONS.DELETE_OWN_COURSE,
    // Add email template permissions
    PERMISSIONS.CREATE_EMAIL_TEMPLATE,
    PERMISSIONS.UPDATE_EMAIL_TEMPLATE,
    PERMISSIONS.DELETE_EMAIL_TEMPLATE,
    PERMISSIONS.VIEW_EMAIL_TEMPLATE,
    PERMISSIONS.LIST_EMAIL_TEMPLATES,
    PERMISSIONS.TOGGLE_EMAIL_TEMPLATE_STATUS,
    PERMISSIONS.RENDER_EMAIL_TEMPLATE,
    PERMISSIONS.VIEW_EMAIL_TEMPLATE_STATS,
    // Add scheduled email permissions
    PERMISSIONS.CREATE_SCHEDULE_EMAIL,
    PERMISSIONS.UPDATE_SCHEDULE_EMAIL,
    PERMISSIONS.DELETE_SCHEDULE_EMAIL,
    PERMISSIONS.VIEW_SCHEDULE_EMAIL,
    PERMISSIONS.LIST_SCHEDULE_EMAILS,
    PERMISSIONS.CANCEL_SCHEDULE_EMAIL,
  ],
  [UserRole.CONTRIBUTOR]: [
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.VIEW_USER,
    PERMISSIONS.LIST_USERS,
    PERMISSIONS.TOGGLE_USER_STATUS,
    PERMISSIONS.CREATE_GROUP_LEADER,
    PERMISSIONS.CREATE_SUBSCRIBER,
    PERMISSIONS.VIEW_USER_GROUPS,
    PERMISSIONS.VIEW_USER_STATS,
    PERMISSIONS.BULK_CREATE_USERS,
    PERMISSIONS.CREATE_COMPANY,
    PERMISSIONS.UPDATE_COMPANY,
    PERMISSIONS.DELETE_COMPANY,
    PERMISSIONS.VIEW_COMPANY,
    PERMISSIONS.LIST_COMPANIES,
    PERMISSIONS.CREATE_GROUP,
    PERMISSIONS.UPDATE_GROUP,
    PERMISSIONS.DELETE_GROUP,
    PERMISSIONS.VIEW_GROUP,
    PERMISSIONS.LIST_GROUPS,
    PERMISSIONS.TOGGLE_GROUP_STATUS,
    PERMISSIONS.ADD_GROUP_MEMBER,
    PERMISSIONS.REMOVE_GROUP_MEMBER,
    PERMISSIONS.VERIFY_OTP,
    PERMISSIONS.SET_PASSWORD,
    PERMISSIONS.REQUEST_PASSWORD_RESET,
    PERMISSIONS.RESEND_OTP,
    // Course permissions - Contributors can only view courses
    PERMISSIONS.VIEW_COURSE,
    PERMISSIONS.LIST_COURSES,
    // Add email template permissions
    PERMISSIONS.CREATE_EMAIL_TEMPLATE,
    PERMISSIONS.UPDATE_EMAIL_TEMPLATE,
    PERMISSIONS.DELETE_EMAIL_TEMPLATE,
    PERMISSIONS.VIEW_EMAIL_TEMPLATE,
    PERMISSIONS.LIST_EMAIL_TEMPLATES,
    PERMISSIONS.TOGGLE_EMAIL_TEMPLATE_STATUS,
    PERMISSIONS.RENDER_EMAIL_TEMPLATE,
    PERMISSIONS.VIEW_EMAIL_TEMPLATE_STATS,
    // Add scheduled email permissions
    PERMISSIONS.CREATE_SCHEDULE_EMAIL,
    PERMISSIONS.UPDATE_SCHEDULE_EMAIL,
    PERMISSIONS.DELETE_SCHEDULE_EMAIL,
    PERMISSIONS.VIEW_SCHEDULE_EMAIL,
    PERMISSIONS.LIST_SCHEDULE_EMAILS,
    PERMISSIONS.CANCEL_SCHEDULE_EMAIL,
  ],
  [UserRole.GROUP_LEADER]: [
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.VIEW_USER,
    PERMISSIONS.LIST_USERS,
    PERMISSIONS.CREATE_SUBSCRIBER,
    PERMISSIONS.VIEW_USER_GROUPS,
    PERMISSIONS.VIEW_COMPANY,
    PERMISSIONS.LIST_COMPANIES,
    PERMISSIONS.VIEW_GROUP,
    PERMISSIONS.LIST_GROUPS,
    PERMISSIONS.ADD_GROUP_MEMBER,
    PERMISSIONS.REMOVE_GROUP_MEMBER,
    PERMISSIONS.VERIFY_OTP,
    PERMISSIONS.SET_PASSWORD,
    PERMISSIONS.REQUEST_PASSWORD_RESET,
    PERMISSIONS.RESEND_OTP,
    // Course permissions - Group Leaders can only view courses
    PERMISSIONS.VIEW_COURSE,
    PERMISSIONS.LIST_COURSES,
  ],
  [UserRole.SUBSCRIBER]: [
    PERMISSIONS.VIEW_USER,
    PERMISSIONS.VIEW_USER_GROUPS,
    PERMISSIONS.VIEW_COMPANY,
    PERMISSIONS.LIST_COMPANIES,
    PERMISSIONS.VIEW_GROUP,
    PERMISSIONS.LIST_GROUPS,
    PERMISSIONS.VERIFY_OTP,
    PERMISSIONS.SET_PASSWORD,
    PERMISSIONS.REQUEST_PASSWORD_RESET,
    PERMISSIONS.RESEND_OTP,
    // Course permissions - Subscribers can only view courses
    PERMISSIONS.VIEW_COURSE,
    PERMISSIONS.LIST_COURSES,
  ],
};

// Extended Request interface to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
}

export class RBACService {
  static canCreateRole(creatorRole: UserRole, targetRole: UserRole): boolean {
    const allowedRoles = ROLE_CREATION_PERMISSIONS[creatorRole];
    return allowedRoles.includes(targetRole);
  }

  static hasPermission(role: UserRole, permission: string): boolean {
    const rolePermissions = ROLE_PERMISSIONS[role];
    return rolePermissions.includes(permission);
  }

  static hasHigherOrEqualHierarchy(role1: UserRole, role2: UserRole): boolean {
    return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2];
  }

  static canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
    return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
  }

  static getCreatableRoles(role: UserRole): UserRole[] {
    return ROLE_CREATION_PERMISSIONS[role];
  }

  static getRolePermissions(role: UserRole): string[] {
    return ROLE_PERMISSIONS[role];
  }

  /**
   * Check if user can create courses
   */
  static canCreateCourse(role: UserRole): boolean {
    return role === UserRole.ADMIN;
  }

  /**
   * Check if user can update any course
   */
  static canUpdateAnyCourse(role: UserRole): boolean {
    return role === UserRole.ADMIN;
  }

  /**
   * Check if user can delete any course
   */
  static canDeleteAnyCourse(role: UserRole): boolean {
    return role === UserRole.ADMIN;
  }

  /**
   * Check if user can update their own course
   */
  static canUpdateOwnCourse(role: UserRole): boolean {
    return role === UserRole.ADMIN; // For now, only admins can update courses
  }

  /**
   * Check if user can delete their own course
   */
  static canDeleteOwnCourse(role: UserRole): boolean {
    return role === UserRole.ADMIN; // For now, only admins can delete courses
  }
}

/**
 * Middleware to authenticate user using JWT
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'your-access-secret'
    ) as {
      id: string;
      email: string;
      role: UserRole;
      firstName: string;
      lastName: string;
      isActive: boolean;
    };

    // Verify user exists and is active
    const user = await User.findByPk(payload.id);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // Validate role
    if (!Object.values(UserRole).includes(payload.role)) {
      throw new AppError('Invalid user role', 401);
    }

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
      isActive: payload.isActive,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      if (!req.user.isActive) {
        throw new AppError('Account is deactivated', 403);
      }

      if (!RBACService.hasPermission(req.user.role, permission)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user can create courses (Admin only)
 */
export const requireCourseCreationPermission = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    if (!RBACService.canCreateCourse(req.user.role)) {
      throw new AppError('Only administrators can create courses', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can manage a course (Admin only for now)
 */
export const requireCourseManagementPermission = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // For now, only admins can manage courses
    if (req.user.role !== UserRole.ADMIN) {
      throw new AppError('Only administrators can manage courses', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can create a specific role
 */
export const requireRoleCreationPermission = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    const targetRole = req.body.role as UserRole;

    if (!targetRole) {
      throw new AppError('Role is required', 400);
    }

    if (!Object.values(UserRole).includes(targetRole)) {
      throw new AppError('Invalid role', 400);
    }

    if (!RBACService.canCreateRole(req.user.role, targetRole)) {
      throw new AppError(
        `Your role (${req.user.role}) cannot create users with role (${targetRole})`,
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can manage another user
 */
export const requireUserManagementPermission = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    if (req.body.role) {
      const targetRole = req.body.role as UserRole;

      if (!Object.values(UserRole).includes(targetRole)) {
        throw new AppError('Invalid role', 400);
      }

      if (!RBACService.canCreateRole(req.user.role, targetRole)) {
        throw new AppError(
          `Your role (${req.user.role}) cannot assign users to role (${targetRole})`,
          403
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (requiredRoles: UserRole | UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      if (!req.user.isActive) {
        throw new AppError('Account is deactivated', 403);
      }

      const roles = Array.isArray(requiredRoles)
        ? requiredRoles
        : [requiredRoles];

      if (!roles.includes(req.user.role)) {
        throw new AppError('Insufficient role privileges', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user can access their own data or has permission
 */
export const requireSelfOrPermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      if (!req.user.isActive) {
        throw new AppError('Account is deactivated', 403);
      }

      const targetUserId = req.params.id;

      if (targetUserId === req.user.id) {
        return next();
      }

      if (!RBACService.hasPermission(req.user.role, permission)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Type guard to check if a string is a valid UserRole
 */
export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

/**
 * Safely convert a string to UserRole enum
 */
export const toUserRole = (role: string): UserRole => {
  if (!isValidUserRole(role)) {
    throw new AppError(`Invalid role: ${role}`, 400);
  }
  return role;
};
