import { Request, Response, NextFunction } from 'express';
import { groupService } from '../services/groupService';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/authenticator';
import { validationResult } from 'express-validator';

export class GroupController {
  async getAllGroups(
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
              .map((e) => e.msg)
              .join(', '),
          400
        );
      }

      const {
        name,
        companyId,
        search,
        page,
        limit,
        signInType,
        gophishGroupID,
        groupLeaderId,
      } = req.query;
      const filters = {
        name: name as string,
        companyId: companyId as string,
        search: search as string,
        signInType: signInType as
          | 'withPassword'
          | 'passwordless'
          | 'microsoftEntraID',
        gophishGroupID: gophishGroupID as string,
        groupLeaderId: groupLeaderId as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await groupService.getAllGroups(filters);

      res.status(200).json({
        success: true,
        data: result.groups,
        pagination: result.pagination,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getGroupById(
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
              .map((e) => e.msg)
              .join(', '),
          400
        );
      }

      const group = await groupService.getGroupById(req.params.id);

      res.status(200).json({
        success: true,
        data: group,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async createGroup(
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
              .map((e) => e.msg)
              .join(', '),
          400
        );
      }

      const group = await groupService.createGroup({
        ...req.body,
        createdBy: req.user!.id,
      });

      res.status(201).json({
        success: true,
        data: group,
        message: 'Group created successfully',
        createdBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async createGroupWithLeader(
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
              .map((e) => e.msg)
              .join(', '),
          400
        );
      }

      const group = await groupService.createGroupWithLeader({
        ...req.body,
        createdBy: req.user!.id,
      });

      res.status(201).json({
        success: true,
        data: group,
        message: group.message || 'Group and leader created successfully',
        createdBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateGroup(
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
              .map((e) => e.msg)
              .join(', '),
          400
        );
      }

      const group = await groupService.updateGroup(req.params.id, req.body);

      res.status(200).json({
        success: true,
        data: group,
        message: 'Group updated successfully',
        updatedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleGroupStatus(
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
              .map((e) => e.msg)
              .join(', '),
          400
        );
      }

      const group = await groupService.toggleGroupStatus(req.params.id);

      res.status(200).json({
        success: true,
        data: group,
        message: `Group ${group.isActive ? 'activated' : 'deactivated'} successfully`,
        updatedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteGroup(
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
              .map((e) => e.msg)
              .join(', '),
          400
        );
      }

      const result = await groupService.deleteGroup(req.params.id);

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

  async getGroupsByCompany(
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
              .map((e) => e.msg)
              .join(', '),
          400
        );
      }

      const groups = await groupService.getGroupsByCompanyId(
        req.params.companyId
      );

      res.status(200).json({
        success: true,
        data: groups,
        count: groups.length,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getGroupMembers(
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
              .map((e) => e.msg)
              .join(', '),
          400
        );
      }

      const members = await groupService.getGroupMembers(req.params.id);

      res.status(200).json({
        success: true,
        data: members,
        count: members.length,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async addGroupUser(
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
              .map((e) => e.msg)
              .join(', '),
          400
        );
      }

      const { groupId, userId, role } = req.body;
      const result = await groupService.addGroupUser(groupId, userId, role);

      res.status(200).json({
        success: true,
        message: result.message,
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

export const groupController = new GroupController();
