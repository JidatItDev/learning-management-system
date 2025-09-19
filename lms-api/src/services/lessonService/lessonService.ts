import User from '../../models/users/users';
import Course from '../../models/courses/courses';
import Lesson from '../../models/lessons/lessons';
import { AppError } from '../../middleware/errorHandler';
import { Op } from 'sequelize';
import {
  CreateLessonData,
  UpdateLessonData,
  LessonFilters,
} from './lesson.interface';

export class LessonService {
  /**
   * Get all lessons with optional filtering and pagination
   */
  async getAllLessons(filters: LessonFilters = {}) {
    try {
      const whereClause: any = {};

      // Apply filters
      if (filters.courseId) {
        whereClause.courseId = filters.courseId;
      }
      if (filters.title) {
        whereClause.title = { [Op.like]: `%${filters.title}%` };
      }
      if (filters.description) {
        whereClause.description = { [Op.like]: `%${filters.description}%` };
      }
      if (filters.videoName) {
        whereClause.videoUrl = { [Op.like]: `%${filters.videoName}%` };
      }
      if (filters.videoUrl) {
        whereClause.videoUrl = { [Op.like]: `%${filters.videoUrl}%` };
      }
      if (filters.createdBy) {
        whereClause.createdBy = filters.createdBy;
      }

      // Pagination setup
      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: lessons } = await Lesson.findAndCountAll({
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
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);

      return {
        lessons,
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
      console.error('Error in getAllLessons:', error);
      throw new AppError('Failed to fetch lessons', 500);
    }
  }

  /**
   * Get lesson by ID with related data
   */
  async getLessonById(id: string) {
    try {
      const lesson = await Lesson.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
          },
        ],
      });

      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      return lesson;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in getLessonById:', error);
      throw new AppError('Failed to fetch lesson', 500);
    }
  }

  /**
   * Create a new lesson
   */
  async createLesson(data: CreateLessonData) {
    try {
      // Validate required fields
      if (!data.title || !data.videoName || !data.courseId || !data.createdBy) {
        throw new AppError('Title, courseId, and createdBy are required', 400);
      }

      // Check if lesson with title already exists in the course
      const existingLesson = await Lesson.findOne({
        where: {
          title: { [Op.like]: data.title.trim() },
          courseId: data.courseId,
        },
      });

      if (existingLesson) {
        throw new AppError(
          'Lesson with this title already exists in the course',
          409
        );
      }

      // Verify the course exists
      const course = await Course.findByPk(data.courseId);
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      // Verify the creator exists
      const creator = await User.findByPk(data.createdBy);
      if (!creator) {
        throw new AppError('Creator user not found', 404);
      }

      // Verify creator has permission (is course creator or admin)
      if (course.createdBy !== data.createdBy && creator.role !== 'admin') {
        throw new AppError(
          'Only course creator or admin can create lessons',
          403
        );
      }

      const lesson = await Lesson.create({
        courseId: data.courseId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        videoName: data.videoName?.trim() || null,
        videoUrl: data.videoUrl?.trim() || null,
        createdBy: data.createdBy,
      });

      // Return lesson with creator and course info
      const lessonWithDetails = await Lesson.findByPk(lesson.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
          },
        ],
      });

      return lessonWithDetails;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in createLesson:', error);
      throw new AppError('Failed to create lesson', 500);
    }
  }

  /**
   * Update an existing lesson
   */
  async updateLesson(id: string, data: UpdateLessonData) {
    try {
      const lesson = await Lesson.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
          },
        ],
      });

      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      // If updating title, check for uniqueness within the same course
      if (
        data.title &&
        data.title.trim().toLowerCase() !== lesson.title.toLowerCase()
      ) {
        const existingLesson = await Lesson.findOne({
          where: {
            title: { [Op.like]: data.title.trim() },
            courseId: lesson.courseId,
            id: { [Op.ne]: id },
          },
        });

        if (existingLesson) {
          throw new AppError(
            'Lesson with this title already exists in the course',
            409
          );
        }
      }

      // If updating courseId, verify the new course exists
      if (data.courseId && data.courseId !== lesson.courseId) {
        const newCourse = await Course.findByPk(data.courseId);
        if (!newCourse) {
          throw new AppError('New course not found', 404);
        }

        // Verify creator has permission for the new course
        const creator = await User.findByPk(lesson.createdBy);
        if (
          newCourse.createdBy !== lesson.createdBy &&
          creator?.role !== 'admin'
        ) {
          throw new AppError(
            'Only course creator or admin can move lessons to this course',
            403
          );
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (data.courseId) updateData.courseId = data.courseId;
      if (data.title) updateData.title = data.title.trim();
      if (data.description !== undefined) {
        updateData.description = data.description?.trim() || null;
      }
      if (data.videoName !== undefined) {
        updateData.videoName = data.videoName?.trim() || null;
      }
      if (data.videoUrl !== undefined) {
        updateData.videoUrl = data.videoUrl?.trim() || null;
      }

      await lesson.update(updateData);

      // Return updated lesson with creator and course info
      await lesson.reload({
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          },
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
          },
        ],
      });

      return lesson;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in updateLesson:', error);
      throw new AppError('Failed to update lesson', 500);
    }
  }

  /**
   * Delete a lesson
   */
  async deleteLesson(id: string) {
    try {
      const lesson = await Lesson.findByPk(id);

      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      await lesson.destroy();

      return { message: 'Lesson deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in deleteLesson:', error);
      throw new AppError('Failed to delete lesson', 500);
    }
  }

  /**
   * Check if lesson exists
   */
  async lessonExists(id: string): Promise<boolean> {
    try {
      const lesson = await Lesson.findByPk(id, {
        attributes: ['id'],
      });
      return !!lesson;
    } catch (error) {
      console.error('Error in lessonExists:', error);
      return false;
    }
  }

  /**
   * Get lessons by course ID
   */
  async getLessonsByCourse(courseId: string, filters: LessonFilters = {}) {
    try {
      const whereClause: any = {
        courseId,
      };

      // Apply additional filters
      if (filters.title) {
        whereClause.title = { [Op.like]: `%${filters.title}%` };
      }
      if (filters.description) {
        whereClause.description = { [Op.like]: `%${filters.description}%` };
      }
      if (filters.videoName) {
        whereClause.videoUrl = { [Op.like]: `%${filters.videoName}%` };
      }
      if (filters.videoUrl) {
        whereClause.videoUrl = { [Op.like]: `%${filters.videoUrl}%` };
      }
      if (filters.createdBy) {
        whereClause.createdBy = filters.createdBy;
      }

      // Pagination setup
      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: lessons } = await Lesson.findAndCountAll({
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
            model: Course,
            as: 'course',
            attributes: ['id', 'title'],
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);

      return {
        lessons,
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
      console.error('Error in getLessonsByCourse:', error);
      throw new AppError('Failed to fetch lessons', 500);
    }
  }
}

// Export singleton instance
export const lessonService = new LessonService();

// Export interfaces for convenience
export type {
  CreateLessonData,
  UpdateLessonData,
  LessonFilters,
} from './lesson.interface';
