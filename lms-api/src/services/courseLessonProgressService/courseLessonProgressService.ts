import CourseLessonProgress from '../../models/courseLessonProgresses/courseLessonProgresses';
import User from '../../models/users/users';
import Lesson from '../../models/lessons/lessons';
import Course from '../../models/courses/courses';
import { AppError } from '../../middleware/errorHandler';
import { Op } from 'sequelize';
import {
  CreateCourseLessonProgressData,
  UpdateCourseLessonProgressData,
  CourseLessonProgressFilters,
} from './courseLessonProgress.interface';
import { UserCourse } from '../../models';

export class CourseLessonProgressService {
  /**
   * Get all course lesson progress records with optional filtering and pagination
   */
  async getAllProgress(filters: CourseLessonProgressFilters = {}) {
    try {
      const whereClause: any = {};
      const includeOptions: any[] = [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        },
        {
          model: Lesson,
          as: 'lesson',
          attributes: ['id', 'title', 'courseId'],
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'title'],
            },
          ],
        },
      ];

      if (filters.userId) {
        whereClause.userId = filters.userId;
      }
      if (filters.lessonId) {
        whereClause.lessonId = filters.lessonId;
      }
      if (filters.isCompleted !== undefined) {
        whereClause.isCompleted = filters.isCompleted;
      }
      if (filters.courseId) {
        includeOptions[1].where = { courseId: filters.courseId };
      }

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: progressRecords } =
        await CourseLessonProgress.findAndCountAll({
          where: whereClause,
          order: [['createdAt', 'DESC']],
          limit,
          offset,
          include: includeOptions,
        });

      const totalPages = Math.ceil(count / limit);

      return {
        progressRecords,
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
      console.error('Error in getAllProgress:', error);
      throw new AppError('Failed to fetch course lesson progress records', 500);
    }
  }

  /**
   * Get course lesson progress by ID
   */
  async getProgressById(id: string) {
    try {
      const progress = await CourseLessonProgress.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
          {
            model: Lesson,
            as: 'lesson',
            attributes: ['id', 'title', 'courseId'],
            include: [
              {
                model: Course,
                as: 'course',
                attributes: ['id', 'title'],
              },
            ],
          },
        ],
      });

      if (!progress) {
        throw new AppError('Course lesson progress not found', 404);
      }

      return progress;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in getProgressById:', error);
      throw new AppError('Failed to fetch course lesson progress', 500);
    }
  }

  /**
   * Create a new course lesson progress record
   */
  async createProgress(data: CreateCourseLessonProgressData) {
    try {
      if (!data.userId || !data.lessonId) {
        throw new AppError('userId and lessonId are required', 400);
      }

      const existingProgress = await CourseLessonProgress.findOne({
        where: {
          userId: data.userId,
          lessonId: data.lessonId,
        },
      });

      if (existingProgress) {
        throw new AppError(
          'Progress record already exists for this user and lesson',
          409
        );
      }

      const user = await User.findByPk(data.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const lesson = await Lesson.findByPk(data.lessonId, {
        include: [{ model: Course, as: 'course' }],
      });
      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      // Verify user is enrolled in the course
      const isEnrolled = await UserCourse.findOne({
        where: {
          userId: data.userId,
          courseId: lesson.courseId,
        },
      });
      if (!isEnrolled) {
        throw new AppError('User is not enrolled in the course', 403);
      }

      const progress = await CourseLessonProgress.create({
        userId: data.userId,
        lessonId: data.lessonId,
        isCompleted: data.isCompleted || false,
        completedAt: data.isCompleted ? new Date() : null,
      });

      const progressWithDetails = await CourseLessonProgress.findByPk(
        progress.id,
        {
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
            },
            {
              model: Lesson,
              as: 'lesson',
              attributes: ['id', 'title', 'courseId'],
              include: [
                {
                  model: Course,
                  as: 'course',
                  attributes: ['id', 'title'],
                },
              ],
            },
          ],
        }
      );

      return progressWithDetails;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in createProgress:', error);
      throw new AppError('Failed to create course lesson progress', 500);
    }
  }

  /**
   * Update an existing course lesson progress record
   */
  async updateProgress(id: string, data: UpdateCourseLessonProgressData) {
    try {
      const progress = await CourseLessonProgress.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
          {
            model: Lesson,
            as: 'lesson',
            attributes: ['id', 'title', 'courseId'],
            include: [
              {
                model: Course,
                as: 'course',
                attributes: ['id', 'title'],
              },
            ],
          },
        ],
      });

      if (!progress) {
        throw new AppError('Course lesson progress not found', 404);
      }

      const updateData: any = {};
      if (data.isCompleted !== undefined) {
        updateData.isCompleted = data.isCompleted;
      }

      await progress.update(updateData);

      await progress.reload({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
          {
            model: Lesson,
            as: 'lesson',
            attributes: ['id', 'title', 'courseId'],
            include: [
              {
                model: Course,
                as: 'course',
                attributes: ['id', 'title'],
              },
            ],
          },
        ],
      });

      return progress;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in updateProgress:', error);
      throw new AppError('Failed to update course lesson progress', 500);
    }
  }

  /**
   * Delete a course lesson progress record
   */
  async deleteProgress(id: string) {
    try {
      const progress = await CourseLessonProgress.findByPk(id);

      if (!progress) {
        throw new AppError('Course lesson progress not found', 404);
      }

      await progress.destroy();

      return { message: 'Course lesson progress deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in deleteProgress:', error);
      throw new AppError('Failed to delete course lesson progress', 500);
    }
  }

  /**
   * Check if course lesson progress exists
   */
  async progressExists(id: string): Promise<boolean> {
    try {
      const progress = await CourseLessonProgress.findByPk(id, {
        attributes: ['id'],
      });
      return !!progress;
    } catch (error) {
      console.error('Error in progressExists:', error);
      return false;
    }
  }

  async getCourseProgress(userId: string, courseId: string) {
    try {
      const lessons = await Lesson.count({ where: { courseId } });
      const completedLessons = await CourseLessonProgress.count({
        where: {
          userId,
          lessonId: {
            [Op.in]: await Lesson.findAll({
              where: { courseId },
              attributes: ['id'],
            }).then((l) => l.map((l) => l.id)),
          },
          isCompleted: true,
        },
      });
      const completionPercentage =
        lessons > 0 ? (completedLessons / lessons) * 100 : 0;
      return {
        userId,
        courseId,
        completionPercentage,
        completedLessons,
        totalLessons: lessons,
      };
    } catch (error) {
      console.error('Error in getCourseProgress:', error);
      throw new AppError('Failed to fetch course progress', 500);
    }
  }
}

// Export singleton instance
export const courseLessonProgressService = new CourseLessonProgressService();

// Export interfaces for convenience
export type {
  CreateCourseLessonProgressData,
  UpdateCourseLessonProgressData,
  CourseLessonProgressFilters,
} from './courseLessonProgress.interface';
