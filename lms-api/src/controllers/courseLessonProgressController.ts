import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, UserRole } from '../middleware/authenticator';
import {
  courseLessonProgressService,
  CourseLessonProgressFilters,
  CreateCourseLessonProgressData,
  UpdateCourseLessonProgressData,
} from '../services/courseLessonProgressService/courseLessonProgressService';

export class CourseLessonProgressController {
  /**
   * Get all course lesson progress records with optional filtering and pagination
   * GET /api/course-lesson-progress
   * Required Permission: LIST_COURSE_LESSON_PROGRESS
   */
  async getAllProgress(
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

      const filters: CourseLessonProgressFilters = {
        userId: req.query.userId as string,
        lessonId: req.query.lessonId as string,
        courseId: req.query.courseId as string,
        isCompleted: req.query.isCompleted
          ? req.query.isCompleted === 'true'
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await courseLessonProgressService.getAllProgress(filters);

      res.status(200).json({
        success: true,
        data: result.progressRecords,
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
   * Get authenticated user's progress records with optional filtering and pagination
   * GET /api/course-lesson-progress/my-progress
   * Required Permission: VIEW_COURSE_LESSON_PROGRESS
   */
  async getMyProgress(
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

      const filters: CourseLessonProgressFilters = {
        userId: req.user!.id, // Restrict to the authenticated user's ID
        lessonId: req.query.lessonId as string,
        courseId: req.query.courseId as string,
        isCompleted: req.query.isCompleted
          ? req.query.isCompleted === 'true'
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await courseLessonProgressService.getAllProgress(filters);

      res.status(200).json({
        success: true,
        data: result.progressRecords,
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
   * Get course progress for a user
   * GET /api/course-lesson-progress/course/:courseId
   * Required Permission: VIEW_COURSE_LESSON_PROGRESS (User themselves or Admin)
   */
  async getCourseProgress(
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

      const { courseId } = req.params;
      const userId = req.query.userId as string || req.user!.id;

      // Restrict to own progress unless admin
      if (userId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
        throw new AppError('You can only view your own course progress', 403);
      }

      const result = await courseLessonProgressService.getCourseProgress(userId, courseId);

      res.status(200).json({
        success: true,
        data: result,
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
   * Get course lesson progress by ID
   * GET /api/course-lesson-progress/:id
   * Required Permission: VIEW_COURSE_LESSON_PROGRESS
   */
  async getProgressById(
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

      const { id } = req.params;

      const progress = await courseLessonProgressService.getProgressById(id);

      res.status(200).json({
        success: true,
        data: progress,
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
   * Create a new course lesson progress record
   * POST /api/course-lesson-progress
   * Required Permission: CREATE_COURSE_LESSON_PROGRESS (User themselves or Admin)
   */
  async createProgress(
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

      const createData: CreateCourseLessonProgressData = {
        userId: req.body.userId,
        lessonId: req.body.lessonId,
        isCompleted: req.body.isCompleted || false,
      };

      // Only allow users to create progress for themselves unless they're admin
      if (createData.userId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
        throw new AppError('You can only create progress for yourself', 403);
      }

      const progress = await courseLessonProgressService.createProgress(createData);

      res.status(201).json({
        success: true,
        data: progress,
        message: 'Course lesson progress created successfully',
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
   * Update an existing course lesson progress record
   * PUT /api/course-lesson-progress/:id
   * Required Permission: UPDATE_COURSE_LESSON_PROGRESS (User themselves or Admin)
   */
  async updateProgress(
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

      const { id } = req.params;

      const existingProgress = await courseLessonProgressService.getProgressById(id);

      if (existingProgress.userId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
        throw new AppError('You can only update your own progress', 403);
      }

      const updateData: UpdateCourseLessonProgressData = {
        isCompleted: req.body.isCompleted,
      };

      const progress = await courseLessonProgressService.updateProgress(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Course lesson progress updated successfully',
        data: progress,
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
   * Delete a course lesson progress record
   * DELETE /api/course-lesson-progress/:id
   * Required Permission: DELETE_COURSE_LESSON_PROGRESS (Admin only)
   */
  async deleteProgress(
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

      const { id } = req.params;

      if (req.user!.role !== UserRole.ADMIN) {
        throw new AppError('Only admins can delete progress records', 403);
      }

      const result = await courseLessonProgressService.deleteProgress(id);

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
   * Check if course lesson progress exists
   * GET /api/course-lesson-progress/:id/exists
   * Required Permission: VIEW_COURSE_LESSON_PROGRESS
   */
  async progressExists(
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

      const { id } = req.params;

      const exists = await courseLessonProgressService.progressExists(id);

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

// Export singleton instance
export const courseLessonProgressController = new CourseLessonProgressController();
