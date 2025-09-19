import { Request, Response, NextFunction } from 'express';
import { scheduleEmailService } from '../services/scheduleEmailService/scheduleEmailService';
import { AppError } from '../middleware/errorHandler';
import {
  requireRole,
  UserRole,
  requirePermission,
  PERMISSIONS,
  AuthenticatedRequest,
} from '../middleware/authenticator';
import { ScheduleStatus } from '../models/scheduleEmails/scheduleEmails';

class ScheduleEmailController {
  // Create a new scheduled email (Admin and Contributor)
  async createScheduleEmail(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { templateId, customSubject, recipientIds, status, scheduledAt } =
        req.body;
      if (!templateId || !customSubject || !scheduledAt) {
        throw new AppError(
          'templateId, customSubject, and scheduledAt are required',
          400
        );
      }
      const scheduledAtDate = new Date(scheduledAt);
      if (isNaN(scheduledAtDate.getTime())) {
        throw new AppError('Invalid scheduledAt date format', 400);
      }

      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const schedule = await scheduleEmailService.createScheduleEmail({
        templateId,
        customSubject,
        recipientIds: recipientIds || null,
        status: status || ScheduleStatus.DRAFT,
        createdBy: req.user.id,
        scheduledAt: scheduledAtDate,
      });
      res.status(201).json({
        success: true,
        data: schedule,
        message: 'Scheduled email created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all scheduled emails with pagination and filtering (Admin and Contributor)
  async getAllScheduleEmails(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page, limit, status, createdBy } = req.query;
      const schedules = await scheduleEmailService.getAllScheduleEmails({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as ScheduleStatus,
        createdBy: createdBy as string,
      });
      res.json({
        success: true,
        data: schedules.schedules,
        total: schedules.total,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        message: 'Scheduled emails retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a single scheduled email by ID (Admin and Contributor)
  async getScheduleEmailById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schedule = await scheduleEmailService.getScheduleEmailById(
        req.params.id
      );
      res.json({
        success: true,
        data: schedule,
        message: 'Scheduled email retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Update a scheduled email (Admin and Contributor)
  async updateScheduleEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { customSubject, recipientIds, status, scheduledAt } = req.body;
      if (!customSubject && !recipientIds && !status && !scheduledAt) {
        throw new AppError(
          'At least one field (customSubject, recipientIds, status, scheduledAt) must be provided',
          400
        );
      }
      let scheduledAtDate;
      if (scheduledAt) {
        scheduledAtDate = new Date(scheduledAt);
        if (isNaN(scheduledAtDate.getTime())) {
          throw new AppError('Invalid scheduledAt date format', 400);
        }
      }
      const schedule = await scheduleEmailService.updateScheduleEmail(
        req.params.id,
        {
          customSubject,
          recipientIds,
          status,
          scheduledAt: scheduledAtDate,
        }
      );
      res.json({
        success: true,
        data: schedule,
        message: 'Scheduled email updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a scheduled email (Admin and Contributor)
  async deleteScheduleEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await scheduleEmailService.deleteScheduleEmail(req.params.id);
      res.json({
        success: true,
        message: 'Scheduled email deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancel a scheduled email (Admin and Contributor)
  async cancelScheduleEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const schedule = await scheduleEmailService.cancelScheduleEmail(
        req.params.id
      );
      res.json({
        success: true,
        data: schedule,
        message: 'Scheduled email cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const scheduleEmailController = new ScheduleEmailController();

// {
//   createScheduleEmail: [
//     requireRole([UserRole.ADMIN, UserRole.CONTRIBUTOR]),
//     requirePermission(PERMISSIONS.CREATE_SCHEDULE_EMAIL),
//     (req: Request, res: Response, next: NextFunction) =>
//       new ScheduleEmailController().createScheduleEmail(req, res, next),
//   ],
//   getAllScheduleEmails: [
//     requireRole([UserRole.ADMIN, UserRole.CONTRIBUTOR]),
//     requirePermission(PERMISSIONS.LIST_SCHEDULE_EMAILS),
//     (req: Request, res: Response, next: NextFunction) =>
//       new ScheduleEmailController().getAllScheduleEmails(req, res, next),
//   ],
//   getScheduleEmailById: [
//     requireRole([UserRole.ADMIN, UserRole.CONTRIBUTOR]),
//     requirePermission(PERMISSIONS.VIEW_SCHEDULE_EMAIL),
//     (req: Request, res: Response, next: NextFunction) =>
//       new ScheduleEmailController().getScheduleEmailById(req, res, next),
//   ],
//   updateScheduleEmail: [
//     requireRole([UserRole.ADMIN, UserRole.CONTRIBUTOR]),
//     requirePermission(PERMISSIONS.UPDATE_SCHEDULE_EMAIL),
//     (req: Request, res: Response, next: NextFunction) =>
//       new ScheduleEmailController().updateScheduleEmail(req, res, next),
//   ],
//   deleteScheduleEmail: [
//     requireRole([UserRole.ADMIN, UserRole.CONTRIBUTOR]),
//     requirePermission(PERMISSIONS.DELETE_SCHEDULE_EMAIL),
//     (req: Request, res: Response, next: NextFunction) =>
//       new ScheduleEmailController().deleteScheduleEmail(req, res, next),
//   ],
//   cancelScheduleEmail: [
//     requireRole([UserRole.ADMIN, UserRole.CONTRIBUTOR]),
//     requirePermission(PERMISSIONS.CANCEL_SCHEDULE_EMAIL),
//     (req: Request, res: Response, next: NextFunction) =>
//       new ScheduleEmailController().cancelScheduleEmail(req, res, next),
//   ],
// };
