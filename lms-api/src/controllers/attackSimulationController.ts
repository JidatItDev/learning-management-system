import { Request, Response, NextFunction } from 'express';
import { attackSimulationService, CreateAttackSimulationData, UpdateAttackSimulationData, AttackSimulationFilters } from '../services/attackSimulationService/attackSimulationService';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, UserRole, requirePermission } from '../middleware/authenticator';
const { validationResult } = require('express-validator');

export class AttackSimulationController {
  /**
   * Get all attack simulations with optional filtering and pagination
   * GET /api/attack-simulations
   * Required Permission: LIST_ATTACK_SIMULATIONS
   */
  async getAllAttackSimulations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' + errors.array().map((e: any) => e.msg).join(', '),
          400
        );
      }

      const filters: AttackSimulationFilters = {
        courseId: req.query.courseId as string,
        name: req.query.name as string,
        createdBy: req.query.createdBy as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await attackSimulationService.getAllAttackSimulations(filters);

      res.status(200).json({
        success: true,
        data: result.attackSimulations,
        pagination: result.pagination,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get attack simulation by ID
   * GET /api/attack-simulations/:id
   * Required Permission: VIEW_ATTACK_SIMULATION
   */
  async getAttackSimulationById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' + errors.array().map((e: any) => e.msg).join(', '),
          400
        );
      }

      const { id } = req.params;

      const attackSimulation = await attackSimulationService.getAttackSimulationById(id);

      res.status(200).json({
        success: true,
        data: attackSimulation,
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new attack simulation
   * POST /api/attack-simulations
   * Required Permission: CREATE_ATTACK_SIMULATION
   */
  async createAttackSimulation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' + errors.array().map((e: any) => e.msg).join(', '),
          400
        );
      }

      const createData: CreateAttackSimulationData = {
        courseId: req.body.courseId,
        name: req.body.name,
        template: req.body.template,
        url: req.body.url,
        page: req.body.page,
        smtp: req.body.smtp,
        createdBy: req.user!.id,
      };

      const attackSimulation = await attackSimulationService.createAttackSimulation(createData);

      res.status(201).json({
        success: true,
        data: attackSimulation,
        message: 'Attack simulation created successfully',
        createdBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing attack simulation
   * PUT /api/attack-simulations/:id
   * Required Permission: UPDATE_ATTACK_SIMULATION
   */
  async updateAttackSimulation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' + errors.array().map((e: any) => e.msg).join(', '),
          400
        );
      }

      const { id } = req.params;

      const existingSimulation = await attackSimulationService.getAttackSimulationById(id);

      if (existingSimulation.createdBy !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
        throw new AppError('You can only update attack simulations you created', 403);
      }

      const updateData: UpdateAttackSimulationData = {
        name: req.body.name,
        template: req.body.template,
        url: req.body.url,
        page: req.body.page,
        smtp: req.body.smtp,
      };

      const attackSimulation = await attackSimulationService.updateAttackSimulation(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Attack simulation updated successfully',
        data: attackSimulation,
        updatedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an attack simulation
   * DELETE /api/attack-simulations/:id
   * Required Permission: DELETE_ATTACK_SIMULATION
   */
  async deleteAttackSimulation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' + errors.array().map((e: any) => e.msg).join(', '),
          400
        );
      }

      const { id } = req.params;

      const existingSimulation = await attackSimulationService.getAttackSimulationById(id);

      if (existingSimulation.createdBy !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
        throw new AppError('You can only delete attack simulations you created', 403);
      }

      const result = await attackSimulationService.deleteAttackSimulation(id);

      res.status(200).json({
        success: true,
        message: result.message,
        deletedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if attack simulation exists
   * GET /api/attack-simulations/:id/exists
   * Required Permission: VIEW_ATTACK_SIMULATION
   */
  async attackSimulationExists(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(
          'Validation failed: ' + errors.array().map((e: any) => e.msg).join(', '),
          400
        );
      }

      const { id } = req.params;

      const exists = await attackSimulationService.attackSimulationExists(id);

      res.status(200).json({
        success: true,
        data: { exists },
        requestedBy: {
          id: req.user?.id,
          role: req.user?.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const attackSimulationController = new AttackSimulationController();
