import { Request, Response, NextFunction } from 'express';
import { scheduleAttackSimulationService } from '../services/scheduleAttackSimulationService/scheduleAttackSimulationService';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/authenticator';
import { validationResult } from 'express-validator';
import { Status, LaunchStatus } from '../models/scheduleAttackSimulations/scheduleAttackSimulations';

export class ScheduleAttackSimulationController {
  async getAllScheduleAttackSimulations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const { groupId, bundleId, status, launchStatus, page, limit } = req.query;
      const filters: {
        groupId?: string;
        bundleId?: string;
        status?: Status;
        launchStatus?: LaunchStatus;
        page?: number;
        limit?: number;
      } = {
        groupId: groupId as string,
        bundleId: bundleId as string,
        status: status as Status,
        launchStatus: launchStatus as LaunchStatus,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined
      };

      const result = await scheduleAttackSimulationService.getAllScheduleAttackSimulations(filters);

      res.status(200).json({
        success: true,
        data: result.schedules,
        pagination: result.pagination,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async getScheduleAttackSimulationById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const schedule = await scheduleAttackSimulationService.getScheduleAttackSimulationById(req.params.id);

      res.status(200).json({
        success: true,
        data: schedule,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async createScheduleAttackSimulation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const { courseIds, ...data } = req.body;
      const schedule = await scheduleAttackSimulationService.createScheduleAttackSimulation({
        ...data,
        courseIds,
        createdBy: req.user!.id
      });

      res.status(201).json({
        success: true,
        data: schedule,
        message: 'Scheduled attack simulation created successfully',
        createdBy: {
          id: req.user?.id,
          role: req.user?.role
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async updateScheduleAttackSimulation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const { courseIds, ...data } = req.body;
      const schedule = await scheduleAttackSimulationService.updateScheduleAttackSimulation(req.params.id, {
        ...data,
        courseIds
      });

      res.status(200).json({
        success: true,
        data: schedule,
        message: 'Scheduled attack simulation updated successfully',
        updatedBy: {
          id: req.user?.id,
          role: req.user?.role
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteScheduleAttackSimulation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
      }

      const result = await scheduleAttackSimulationService.deleteScheduleAttackSimulation(req.params.id);

      res.status(200).json({
        success: true,
        message: result.message,
        deletedBy: {
          id: req.user?.id,
          role: req.user?.role
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

export const scheduleAttackSimulationController = new ScheduleAttackSimulationController();