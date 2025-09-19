import { Op } from 'sequelize';
import AttackSimulation from '../../models/attackSimulations/attackSimulations';
import User from '../../models/users/users';
import Course from '../../models/courses/courses';
import { AppError } from '../../middleware/errorHandler';
import {
  CreateAttackSimulationData,
  UpdateAttackSimulationData,
  AttackSimulationFilters,
} from './attackSimulation.interface';

export class AttackSimulationService {
  /**
   * Get all attack simulations with optional filtering and pagination
   */
  async getAllAttackSimulations(filters: AttackSimulationFilters = {}) {
    try {
      const whereClause: any = {};

      if (filters.courseId) {
        whereClause.courseId = filters.courseId;
      }

      if (filters.name) {
        whereClause.name = { [Op.like]: `%${filters.name}%` };
      }

      if (filters.createdBy) {
        whereClause.createdBy = filters.createdBy;
      }

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: attackSimulations } = await AttackSimulation.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
          },
          {
            model: User,
            as: 'createdByUser',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);

      return {
        attackSimulations,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
      };
    } catch (error) {
      console.error('Error in getAllAttackSimulations:', error);
      throw new AppError('Failed to fetch attack simulations', 500);
    }
  }

  /**
   * Get attack simulation by ID
   */
  async getAttackSimulationById(id: string) {
    try {
      const attackSimulation = await AttackSimulation.findByPk(id, {
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
          },
          {
            model: User,
            as: 'createdByUser',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
        ],
      });

      if (!attackSimulation) {
        throw new AppError('Attack simulation not found', 404);
      }

      return attackSimulation;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in getAttackSimulationById:', error);
      throw new AppError('Failed to fetch attack simulation', 500);
    }
  }

  /**
   * Create a new attack simulation
   */
  async createAttackSimulation(data: CreateAttackSimulationData) {
    try {
      if (!data.courseId || !data.name || !data.template || !data.url || !data.page || !data.smtp || !data.createdBy) {
        throw new AppError('All required fields must be provided', 400);
      }

      const existingSimulation = await AttackSimulation.findOne({
        where: {
          courseId: data.courseId,
          name: { [Op.like]: data.name.trim() },
        },
      });

      if (existingSimulation) {
        throw new AppError('Attack simulation with this name already exists for the course', 409);
      }

      //const templateJson = typeof data.template === 'string' ? data.template : JSON.stringify(data.template);

      const attackSimulation = await AttackSimulation.create({
        courseId: data.courseId,
        name: data.name.trim(),
        template: data.template.trim(),
        url: data.url.trim(),
        page: data.page.trim(),
        smtp: data.smtp.trim(),
        createdBy: data.createdBy,
      });

      const attackSimulationWithRelations = await AttackSimulation.findByPk(attackSimulation.id, {
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
          },
          {
            model: User,
            as: 'createdByUser',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
        ],
      });

      return attackSimulationWithRelations;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in createAttackSimulation:', error);
      throw new AppError('Failed to create attack simulation', 500);
    }
  }

  /**
   * Update an existing attack simulation
   */
  async updateAttackSimulation(id: string, data: UpdateAttackSimulationData) {
    try {
      const attackSimulation = await AttackSimulation.findByPk(id);

      if (!attackSimulation) {
        throw new AppError('Attack simulation not found', 404);
      }

      if (data.name && data.name.trim().toLowerCase() !== attackSimulation.name.toLowerCase()) {
        const existingSimulation = await AttackSimulation.findOne({
          where: {
            courseId: attackSimulation.courseId,
            name: { [Op.like]: data.name.trim() },
            id: { [Op.ne]: id },
          },
        });

        if (existingSimulation) {
          throw new AppError('Attack simulation with this name already exists for the course', 409);
        }
      }

      const updateData: any = {};
      if (data.name) updateData.name = data.name.trim();
      if (data.template) updateData.template = data.template.trim()  //typeof data.template === 'string' ? data.template : JSON.stringify(data.template);
      if (data.url) updateData.url = data.url.trim();
      if (data.page) updateData.page = data.page.trim();
      if (data.smtp) updateData.smtp = data.smtp.trim();

      await attackSimulation.update(updateData);

      await attackSimulation.reload({
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
          },
          {
            model: User,
            as: 'createdByUser',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
        ],
      });

      return attackSimulation;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in updateAttackSimulation:', error);
      throw new AppError('Failed to update attack simulation', 500);
    }
  }

  /**
   * Delete an attack simulation
   */
  async deleteAttackSimulation(id: string) {
    try {
      const attackSimulation = await AttackSimulation.findByPk(id);

      if (!attackSimulation) {
        throw new AppError('Attack simulation not found', 404);
      }

      await attackSimulation.destroy();

      return { message: 'Attack simulation deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in deleteAttackSimulation:', error);
      throw new AppError('Failed to delete attack simulation', 500);
    }
  }

  /**
   * Check if attack simulation exists
   */
  async attackSimulationExists(id: string): Promise<boolean> {
    try {
      const attackSimulation = await AttackSimulation.findByPk(id, {
        attributes: ['id'],
      });
      return !!attackSimulation;
    } catch (error) {
      console.error('Error in attackSimulationExists:', error);
      return false;
    }
  }
}

export const attackSimulationService = new AttackSimulationService();
export type { CreateAttackSimulationData, UpdateAttackSimulationData, AttackSimulationFilters };
