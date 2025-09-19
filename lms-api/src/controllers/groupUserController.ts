import { Request, Response, NextFunction } from 'express';
import { groupUserService } from '../services/groupUserService/groupUserService';
import { AppError } from '../middleware/errorHandler';
import {
  AuthenticatedRequest,
  authenticate,
  requirePermission,
  PERMISSIONS,
  UserRole,
} from '../middleware/authenticator';

const { validationResult } = require('express-validator');

export class GroupUserController {
  /**
   * Add an existing user to a group
   * POST /api/groups/:id/members
   * Required Permission: ADD_GROUP_MEMBER
   */
  async addGroupMember(
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

      const groupUser = await groupUserService.addGroupMember(
        req.params.id,
        req.body,
        req.user!.role
      );

      res.status(201).json({
        success: true,
        data: groupUser,
        message: 'User added to group successfully',
        createdBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Add multiple existing users to a group
   * POST /api/groups/:id/members/bulk
   * Required Permission: ADD_GROUP_MEMBER
   */
  async bulkAddGroupMembers(
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

      const result = await groupUserService.bulkAddGroupMembers(
        { groupId: req.params.id, members: req.body.members },
        req.user!.role
      );

      res.status(201).json({
        success: true,
        message: `${result.added.length} users added to group successfully`,
        data: {
          added: result.added,
          errors: result.errors,
        },
        createdBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new user and add to group
   * POST /api/groups/:id/members/new
   * Required Permission: ADD_GROUP_MEMBER
   */
  async createGroupMember(
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

      const result = await groupUserService.createGroupMember(
        { groupId: req.params.id, user: req.body },
        req.user!.role
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'User created and added to group successfully',
        createdBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Remove a user from a group
   * DELETE /api/groups/:id/members/:userId
   * Required Permission: REMOVE_GROUP_MEMBER
   */

  async bulkCreateGroupMembers(
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

      const result = await groupUserService.bulkCreateGroupMembers(
        { groupId: req.params.id, users: req.body.users },
        req.user!.role
      );

      res.status(201).json({
        success: true,
        message: `${result.created.length} users created and added to group successfully`,
        data: {
          created: result.created,
          errors: result.errors,
        },
        createdBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async removeGroupMember(
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

      const result = await groupUserService.removeGroupMember(
        req.params.id,
        req.params.userId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        deletedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get a specific group member
   * GET /api/groups/:id/members/:userId
   * Required Permission: VIEW_GROUP
   */
  async getGroupMember(
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

      const groupUser = await groupUserService.getGroupMember(
        req.params.id,
        req.params.userId
      );

      res.status(200).json({
        success: true,
        data: groupUser,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const groupUserController = new GroupUserController();
