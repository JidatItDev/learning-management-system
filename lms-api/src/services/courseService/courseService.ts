import Course from '../../models/courses/courses';
import User from '../../models/users/users';
import AttackSimulation from '../../models/attackSimulations/attackSimulations';
import { AppError } from '../../middleware/errorHandler';
import { Op } from 'sequelize';
import {
  CreateCourseData,
  UpdateCourseData,
  CourseFilters,
} from './course.interface';
import { sequelize } from '../../models';

export class CourseService {
  /**
   * Get all courses with optional filtering and pagination
   */
  async getAllCourses(filters: CourseFilters = {}) {
    try {
      const whereClause: any = {};

      if (filters.title) {
        whereClause.title = { [Op.like]: `%${filters.title}%` };
      }

      if (filters.description) {
        whereClause.description = { [Op.like]: `%${filters.description}%` };
      }

      if (filters.createdBy) {
        whereClause.createdBy = filters.createdBy;
      }
      if (filters.bundleId) {
        whereClause.id = {
          [Op.in]: sequelize.literal(
            `(SELECT courseId FROM BundleCourses WHERE bundleId = '${filters.bundleId}')`
          ),
        };
      }

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: courses } = await Course.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
          {
            model: AttackSimulation,
            as: 'attackSimulations',
            attributes: [
              'id',
              'name',
              'template',
              'url',
              'page',
              'smtp',
              'createdBy',
              'createdAt',
            ],
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);

      return {
        courses,
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
      console.error('Error in getAllCourses:', error);
      throw new AppError('Failed to fetch courses', 500);
    }
  }

  /**
   * Get course by ID with related data
   */
  async getCourseById(id: string) {
    try {
      const course = await Course.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
          {
            model: AttackSimulation,
            as: 'attackSimulations',
            attributes: [
              'id',
              'name',
              'template',
              'url',
              'page',
              'smtp',
              'createdBy',
              'createdAt',
            ],
          },
        ],
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      return course;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in getCourseById:', error);
      throw new AppError('Failed to fetch course', 500);
    }
  }

  /**
   * Create a new course
   */
  async createCourse(data: CreateCourseData) {
    try {
      if (!data.title || !data.createdBy) {
        throw new AppError('Title and createdBy are required', 400);
      }

      const existingCourse = await Course.findOne({
        where: { title: { [Op.like]: data.title.trim() } },
      });

      if (existingCourse) {
        throw new AppError('Course with this title already exists', 409);
      }

      const creator = await User.findByPk(data.createdBy);
      if (!creator) {
        throw new AppError('Creator user not found', 404);
      }

      const course = await Course.create({
        title: data.title.trim(),
        description: data.description?.trim() || null,
        createdBy: data.createdBy,
      });

      const courseWithRelations = await Course.findByPk(course.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
          {
            model: AttackSimulation,
            as: 'attackSimulations',
            attributes: [
              'id',
              'name',
              'template',
              'url',
              'page',
              'smtp',
              'createdBy',
              'createdAt',
            ],
          },
        ],
      });

      return courseWithRelations;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in createCourse:', error);
      throw new AppError('Failed to create course', 500);
    }
  }

  /**
   * Update an existing course
   */
  async updateCourse(id: string, data: UpdateCourseData) {
    try {
      const course = await Course.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
          {
            model: AttackSimulation,
            as: 'attackSimulations',
            attributes: [
              'id',
              'name',
              'url',
              'page',
              'smtp',
              'createdBy',
              'createdAt',
            ],
          },
        ],
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      if (
        data.title &&
        data.title.trim().toLowerCase() !== course.title.toLowerCase()
      ) {
        const existingCourse = await Course.findOne({
          where: {
            title: { [Op.like]: data.title.trim() },
            id: { [Op.ne]: id },
          },
        });

        if (existingCourse) {
          throw new AppError('Course with this title already exists', 409);
        }
      }

      const updateData: any = {};
      if (data.title) updateData.title = data.title.trim();
      if (data.description !== undefined) {
        updateData.description = data.description?.trim() || null;
      }

      await course.update(updateData);

      await course.reload({
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
          {
            model: AttackSimulation,
            as: 'attackSimulations',
            attributes: [
              'id',
              'name',
              'template',
              'url',
              'page',
              'smtp',
              'createdBy',
              'createdAt',
            ],
          },
        ],
      });

      return course;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in updateCourse:', error);
      throw new AppError('Failed to update course', 500);
    }
  }

  /**
   * Delete a course
   */
  async deleteCourse(id: string) {
    try {
      const course = await Course.findByPk(id);

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      await course.destroy();

      return { message: 'Course deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in deleteCourse:', error);
      throw new AppError('Failed to delete course', 500);
    }
  }

  /**
   * Check if course exists
   */
  async courseExists(id: string): Promise<boolean> {
    try {
      const course = await Course.findByPk(id, {
        attributes: ['id'],
      });
      return !!course;
    } catch (error) {
      console.error('Error in courseExists:', error);
      return false;
    }
  }

  /**
   * Get courses created by a specific user
   */
  async getCoursesByCreator(creatorId: string, filters: CourseFilters = {}) {
    try {
      const whereClause: any = {
        createdBy: creatorId,
      };

      if (filters.title) {
        whereClause.title = { [Op.like]: `%${filters.title}%` };
      }

      if (filters.description) {
        whereClause.description = { [Op.like]: `%${filters.description}%` };
      }

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: courses } = await Course.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
          {
            model: AttackSimulation,
            as: 'attackSimulations',
            attributes: [
              'id',
              'name',
              'template',
              'url',
              'page',
              'smtp',
              'createdBy',
              'createdAt',
            ],
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);

      return {
        courses,
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
      console.error('Error in getCoursesByCreator:', error);
      throw new AppError('Failed to fetch user courses', 500);
    }
  }
}

export const courseService = new CourseService();
export type {
  CreateCourseData,
  UpdateCourseData,
  CourseFilters,
} from './course.interface';
