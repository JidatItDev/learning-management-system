import { Router } from 'express';
import {
  userController,
  authenticate,
  requirePermission,
  requireRoleCreationPermission,
  requireUserManagementPermission,
  requireRole,
  requireSelfOrPermission,
  PERMISSIONS,
  UserRole,
} from '../../../controllers/userController';

const userRouter = Router();

userRouter.get(
  'test-redis-connection',
  userController.testRedis
);


userRouter.get(
  '/get-users',
  authenticate,
  requirePermission(PERMISSIONS.LIST_USERS),
  userController.getAllUsers
);


userRouter.get(
  '/stats',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_USER_STATS),
  userController.getUserStats
);


userRouter.get(
  '/me/permissions',
  authenticate,
  userController.getCurrentUserPermissions
);


userRouter.get(
  '/role/:role',
  authenticate,
  requirePermission(PERMISSIONS.LIST_USERS),
  userController.getUsersByRole
);


userRouter.get(
  '/email/:email',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_USER),
  userController.getUserByEmail
);


userRouter.get(
  '/:id',
  authenticate,
  requireSelfOrPermission(PERMISSIONS.VIEW_USER),
  userController.getUserById
);


userRouter.get(
  '/:id/exists',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_USER),
  userController.userExists
);


userRouter.get(
  '/:id/user-groups',
  authenticate,
  requireSelfOrPermission(PERMISSIONS.VIEW_USER_GROUPS),
  userController.getUserGroups
);

/**
 * @route   GET /api/users/:id/microsoft-invitation-status
 * @desc    Get Microsoft invitation status for a user
 * @access  Private - Requires VIEW_USER permission
 * @params  Params: id
 */
userRouter.get(
  '/:id/microsoft-invitation-status',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_USER),
  userController.getMicrosoftInvitationStatus
);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Private - Requires CREATE_USER permission + role-specific creation permission
 * @body    firstName, lastName, email, password, role, signInType, isActive
 */
userRouter.post(
  '/create-user',
  authenticate,
  requirePermission(PERMISSIONS.CREATE_USER),
  requireRoleCreationPermission,
  userController.createUser
);

// Add these routes to your userRouter.ts

// === EMAIL DEBUGGING ROUTES ===

/**
 * @route   GET /api/users/debug/email-config
 * @desc    Debug email configuration and test connection
 * @access  Private (development only)
 */
userRouter.get(
  '/debug/email-config',
  authenticate,
  userController.debugEmailConfig
);

/**
 * @route   POST /api/users/debug/test-email-detailed
 * @desc    Test email sending with detailed logging
 * @access  Private (development only)
 */
userRouter.post(
  '/debug/test-email-detailed',
  authenticate,
  userController.testEmailDetailed
);

/**
 * @route   POST /api/users/microsoft-signup-enhanced
 * @desc    Enhanced Microsoft signup with better error handling
 * @access  Private - Alternative to test email issues
 */
userRouter.post(
  '/microsoft-signup',
  authenticate,
  //requirePermission(PERMISSIONS.CREATE_USER),
  //requireRoleCreationPermission,
  userController.initiateMicrosoftSignup
);

/**
 * @route   GET /api/users/microsoft-signup/callback
 * @desc    Handle Microsoft Entra ID signup callback
 * @access  Public
 * @params  Query: code, state
 */
userRouter.get(
  '/microsoft-signup/callback',
  userController.microsoftSignupCallback
);

/**
 * @route   POST /api/users/:id/resend-microsoft-invitation
 * @desc    Resend Microsoft Entra ID invitation
 * @access  Private - Requires UPDATE_USER permission
 * @params  Params: id
 */
userRouter.post(
  '/:id/resend-microsoft-invitation',
  authenticate,
  requirePermission(PERMISSIONS.UPDATE_USER),
  userController.resendMicrosoftInvitation
);

/**
 * @route   POST /api/users/bulk
 * @desc    Bulk create users
 * @access  Private - Requires BULK_CREATE_USERS permission + role-specific creation permissions
 * @body    users: Array of user objects
 */
userRouter.post(
  '/bulk',
  authenticate,
  requirePermission(PERMISSIONS.BULK_CREATE_USERS),
  userController.bulkCreateUsers
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update an existing user
 * @access  Private - Requires UPDATE_USER permission + hierarchy check
 * @params  Params: id
 * @body    firstName, lastName, email, password, role, signInType, isActive
 */
userRouter.put(
  '/:id/update-user',
  authenticate,
  requirePermission(PERMISSIONS.UPDATE_USER),
  requireUserManagementPermission,
  userController.updateUser
);


userRouter.patch(
  '/:id/toggle-status',
  authenticate,
  requirePermission(PERMISSIONS.TOGGLE_USER_STATUS),
  userController.toggleUserStatus
);


userRouter.delete(
  '/:id/delete-user',
  authenticate,
  requirePermission(PERMISSIONS.DELETE_USER),
  userController.deleteUser
);


userRouter.post(
  '/test-email',
  authenticate,
  userController.testEmail
);


userRouter.post(
  '/test-email-connection',
  authenticate,
  userController.testEmailConnection
);


userRouter.post(
  '/invite-guest',
  authenticate,
  requirePermission(PERMISSIONS.CREATE_USER),
  userController.inviteGuestUser
);

export default userRouter;