import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, UserRole } from '../middleware/authenticator';
import {
  lessonService,
  LessonFilters,
  CreateLessonData,
  UpdateLessonData,
} from '../services/lessonService/lessonService';

export class LessonController {
  /**
   * Get all lessons with optional filtering and pagination
   * GET /api/lessons
   * Required Permission: LIST_LESSONS
   */
  async getAllLessons(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Check for validation errors
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

      const filters: LessonFilters = {
        courseId: req.query.courseId as string,
        title: req.query.title as string,
        description: req.query.description as string,
        videoUrl: req.query.videoUrl as string,
        createdBy: req.query.createdBy as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      };

      const result = await lessonService.getAllLessons(filters);

      res.status(200).json({
        success: true,
        data: result.lessons,
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
   * Get lesson by ID
   * GET /api/lessons/:id
   * Required Permission: VIEW_LESSON
   */
  async getLessonById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Check for validation errors
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

      const lesson = await lessonService.getLessonById(id);

      res.status(200).json({
        success: true,
        data: lesson,
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
   * Create a new lesson
   * POST /api/lessons
   * Required Permission: CREATE_LESSON (Admin or Course Creator)
   */
  async createLesson(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Check for validation errors
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

      const createData: CreateLessonData = {
        courseId: req.body.courseId,
        title: req.body.title,
        description: req.body.description,
        videoName: req.body.videoName,
        videoUrl: req.body.videoUrl,
        createdBy: req.user!.id,
      };

      const lesson = await lessonService.createLesson(createData);

      res.status(201).json({
        success: true,
        data: lesson,
        message: 'Lesson created successfully',
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
   * Update an existing lesson
   * PUT /api/lessons/:id
   * Required Permission: UPDATE_LESSON
   */
  async updateLesson(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Check for validation errors
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

      // Verify lesson exists and requesting user has permission
      const existingLesson = await lessonService.getLessonById(id);

      // Only allow updates by creator or admin
      if (
        existingLesson.createdBy !== req.user!.id &&
        req.user!.role !== UserRole.ADMIN
      ) {
        throw new AppError('You can only update lessons you created', 403);
      }

      const updateData: UpdateLessonData = {
        courseId: req.body.courseId,
        title: req.body.title,
        description: req.body.description,
        videoName: req.body.videoName,
        videoUrl: req.body.videoUrl,
      };

      const lesson = await lessonService.updateLesson(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Lesson updated successfully',
        data: lesson,
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
   * Delete a lesson
   * DELETE /api/lessons/:id
   * Required Permission: DELETE_LESSON
   */
  async deleteLesson(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Check for validation errors
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

      // Verify lesson exists and requesting user has permission
      const existingLesson = await lessonService.getLessonById(id);

      // Only allow deletion by creator or admin
      if (
        existingLesson.createdBy !== req.user!.id &&
        req.user!.role !== UserRole.ADMIN
      ) {
        throw new AppError('You can only delete lessons you created', 403);
      }

      const result = await lessonService.deleteLesson(id);

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
   * Check if lesson exists
   * GET /api/lessons/:id/exists
   * Required Permission: VIEW_LESSON
   */
  async existingLesson(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Check for validation errors
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

      const exists = await lessonService.lessonExists(id);

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

  /**
   * Get lessons by course ID
   * GET /api/lessons/course/:courseId
   * Required Permission: LIST_LESSONS
   */
  async getLessonsByCourse(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Check for validation errors
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

      const filters: LessonFilters = {
        title: req.query.title as string,
        description: req.query.description as string,
        videoName: req.query.videoName as string,
        videoUrl: req.query.videoUrl as string,
        createdBy: req.query.createdBy as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      };

      const result = await lessonService.getLessonsByCourse(courseId, filters);

      res.status(200).json({
        success: true,
        data: result.lessons,
        pagination: result.pagination,
        courseId: courseId,
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
export const lessonController = new LessonController();
