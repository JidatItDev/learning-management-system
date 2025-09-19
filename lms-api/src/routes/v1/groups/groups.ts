import { Router } from 'express';
import {
  getAllGroupsValidation,
  getGroupByIdValidation,
  createGroupValidation,
  createGroupWithLeaderValidation,
  updateGroupValidation,
  toggleGroupStatusValidation,
  deleteGroupValidation,
  getGroupsByCompanyValidation,
  getGroupMembersValidation,
} from '../../../middleware/groupValidator';
import { groupController } from '../../../controllers/groupController';
import { groupUserController } from '../../../controllers/groupUserController';
import {
  addGroupMemberValidation,
  createGroupMemberValidation,
  removeGroupMemberValidation,
  getGroupMemberValidation,
} from '../../../middleware/groupUserValidator';
import {
  authenticate,
  requirePermission,
  PERMISSIONS,
} from '../../../middleware/authenticator';

import { groupLimiter } from '../../../middleware/rateLimiters';

const groupRouter = Router();

/**
 * @route   GET /api/groups
 * @desc    Get all groups with optional filtering and pagination
 * @access  Private - Requires LIST_GROUPS permission
 * @params  Query: name, companyId, search, page, limit
 */
groupRouter.get(
  '/get-groups',
  authenticate,
  requirePermission(PERMISSIONS.LIST_GROUPS),
  getAllGroupsValidation,
  groupController.getAllGroups
);

/**
 * @route   GET /api/groups/:id
 * @desc    Get group by ID
 * @access  Private - Requires VIEW_GROUP permission
 * @params  Params: id
 */
groupRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_GROUP),
  getGroupByIdValidation,
  groupController.getGroupById
);

/**
 * @route   POST /api/groups
 * @desc    Create a new group
 * @access  Private - Requires CREATE_GROUP permission
 * @body    name, companyId, description, is_active
 */
groupRouter.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.CREATE_GROUP),
  groupLimiter,
  createGroupValidation,
  groupController.createGroup
);

/**
 * @route   POST /api/groups/with-leader
 * @desc    Create a group with a group leader
 * @access  Private - Requires CREATE_GROUP permission
 * @body    Group data + leader data
 */
groupRouter.post(
  '/with-leader',
  authenticate,
  requirePermission(PERMISSIONS.CREATE_GROUP),
  groupLimiter,
  createGroupWithLeaderValidation,
  groupController.createGroupWithLeader
);

/**
 * @route   PUT /api/groups/:id
 * @desc    Update an existing group
 * @access  Private - Requires UPDATE_GROUP permission
 * @params  Params: id
 * @body    name, companyId, description, is_active
 */
groupRouter.put(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.UPDATE_GROUP),
  groupLimiter,
  updateGroupValidation,
  groupController.updateGroup
);

/**
 * @route   PATCH /api/groups/:id/status
 * @desc    Toggle group active status
 * @access  Private - Requires TOGGLE_GROUP_STATUS permission
 * @params  Params: id
 */
groupRouter.patch(
  '/:id/status',
  authenticate,
  requirePermission(PERMISSIONS.TOGGLE_GROUP_STATUS),
  groupLimiter,
  toggleGroupStatusValidation,
  groupController.toggleGroupStatus
);

/**
 * @route   DELETE /api/groups/:id
 * @desc    Delete a group
 * @access  Private - Requires DELETE_GROUP permission
 * @params  Params: id
 */
groupRouter.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.DELETE_GROUP),
  groupLimiter,
  deleteGroupValidation,
  groupController.deleteGroup
);

/**
 * @route   GET /api/groups/company/:companyId
 * @desc    Get groups by company ID
 * @access  Private - Requires LIST_GROUPS permission
 * @params  Params: companyId
 */
groupRouter.get(
  '/company/:companyId',
  authenticate,
  requirePermission(PERMISSIONS.LIST_GROUPS),
  getGroupsByCompanyValidation,
  groupController.getGroupsByCompany
);

/**
 * @route   GET /api/groups/:id/members
 * @desc    Get group members
 * @access  Private - Requires VIEW_GROUP permission
 * @params  Params: id
 */
groupRouter.get(
  '/:id/members',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_GROUP),
  getGroupMembersValidation,
  groupController.getGroupMembers
);

/**
 * @route   POST /api/groups/:id/members
 * @desc    Add existing user to group
 * @access  Private - Requires ADD_GROUP_MEMBER permission
 * @params  Params: id
 * @body    userId
 */
groupRouter.post(
  '/:id/members',
  authenticate,
  requirePermission(PERMISSIONS.ADD_GROUP_MEMBER),
  groupLimiter,
  addGroupMemberValidation,
  groupUserController.addGroupMember
);

/**
 * @route   POST /api/groups/:id/members/bulk
 * @desc    Add multiple existing users to group
 * @access  Private - Requires ADD_GROUP_MEMBER permission
 * @params  Params: id
 * @body    userIds
 */
groupRouter.post(
  '/:id/members/bulk-add',
  authenticate,
  // requirePermission(PERMISSIONS.ADD_GROUP_MEMBER),
  // [
  //   check('members').isArray({ min: 1 }).withMessage('Members array must not be empty'),
  //   check('members.*.userId').isUUID().withMessage('Invalid user ID'),
  //   check('members.*.role').isIn(['groupLeader', 'subscriber']).withMessage('Invalid group role'),
  // ],
  groupUserController.bulkAddGroupMembers
);

/**
 * @route   POST /api/groups/:id/members/new
 * @desc    Create new user and add to group
 * @access  Private - Requires ADD_GROUP_MEMBER permission
 * @params  Params: id
 * @body    User data (firstName, lastName, email, etc.)
 */
groupRouter.post(
  '/:id/members/new',
  authenticate,
  requirePermission(PERMISSIONS.ADD_GROUP_MEMBER),
  groupLimiter,
  createGroupMemberValidation,
  groupUserController.createGroupMember
);

/**
 * @route   POST /api/groups/:id/members/bulk-new
 * @desc    Create multiple new users and add to group
 * @access  Private - Requires ADD_GROUP_MEMBER permission
 * @params  Params: id
 * @body    User data (firstName, lastName, email, etc.)
 */
groupRouter.post(
  '/:id/members/bulk',
  authenticate,
  // requirePermission(PERMISSIONS.ADD_GROUP_MEMBER),
  // [
  //   check('users').isArray({ min: 1 }).withMessage('Users array must not be empty'),
  //   check('users.*.firstName').notEmpty().withMessage('First name is required'),
  //   check('users.*.lastName').notEmpty().withMessage('Last name is required'),
  //   check('users.*.email').isEmail().withMessage('Invalid email format'),
  //   check('users.*.signInType')
  //     .isIn(['withPassword', 'passwordless', 'microsoftEntraID'])
  //     .withMessage('Invalid sign-in type'),
  //   check('users.*.role').isIn(['groupLeader', 'subscriber']).withMessage('Invalid group role'),
  // ],
  groupUserController.bulkCreateGroupMembers
);

/**
 * @route   DELETE /api/groups/:id/members/:userId
 * @desc    Remove user from group
 * @access  Private - Requires REMOVE_GROUP_MEMBER permission
 * @params  Params: id, userId
 */
groupRouter.delete(
  '/:id/members/:userId',
  authenticate,
  requirePermission(PERMISSIONS.REMOVE_GROUP_MEMBER),
  groupLimiter,
  removeGroupMemberValidation,
  groupUserController.removeGroupMember
);

/**
 * @route   GET /api/groups/:id/members/:userId
 * @desc    Get specific group member
 * @access  Private - Requires VIEW_GROUP permission
 * @params  Params: id, userId
 */
groupRouter.get(
  '/:id/members/:userId',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_GROUP),
  getGroupMemberValidation,
  groupUserController.getGroupMember
);

export default groupRouter;

/**
 * Route Summary:
 *
 * GET Routes:
 * - GET /api/groups                    - Get all groups with filtering/pagination
 * - GET /api/groups/:id                - Get group by ID
 * - GET /api/groups/company/:companyId - Get groups by company ID
 * - GET /api/groups/:id/members        - Get group members
 * - GET /api/groups/:id/members/:userId - Get specific group member
 *
 * POST Routes:
 * - POST /api/groups                   - Create new group
 * - POST /api/groups/with-leader       - Create group with leader
 * - POST /api/groups/:id/members       - Add existing user to group
 * - POST /api/groups/:id/members/new   - Create new user and add to group
 *
 * PUT Routes:
 * - PUT /api/groups/:id                - Update existing group
 *
 * PATCH Routes:
 * - PATCH /api/groups/:id/status       - Toggle group status
 *
 * DELETE Routes:
 * - DELETE /api/groups/:id             - Delete group
 * - DELETE /api/groups/:id/members/:userId - Remove user from group
 *
 * Permission Requirements:
 * - LIST_GROUPS: Get all groups, get groups by company
 * - VIEW_GROUP: Get group by ID, get group members, get specific member
 * - CREATE_GROUP: Create new group, create group with leader
 * - UPDATE_GROUP: Update existing group
 * - DELETE_GROUP: Delete group
 * - TOGGLE_GROUP_STATUS: Toggle group status
 * - ADD_GROUP_MEMBER: Add user to group, create new user in group
 * - REMOVE_GROUP_MEMBER: Remove user from group
 *
 * Special Middleware:
 * - authenticate: Validates user authentication
 * - requirePermission: Checks specific permission
 * - groupLimiter: Rate limiting for group operations
 * - Various validation middleware for input validation
 *
 * Usage in main app:
 * import groupRoutes from './routes/groupRoutes';
 * app.use('/api/groups', groupRoutes);
 */