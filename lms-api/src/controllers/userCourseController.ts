import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, UserRole } from '../middleware/authenticator';
import {
  CreateUserCourseData,
  UserCourseFilters,
} from '../services/userCourseService/userCourse.interface';

import {userCourseService} from '../services/userCourseService/userCourseService';

export class UserCourseController {
  /**
   * Get all user course enrollments with optional filtering and pagination
   * GET /api/user-courses
   * Required Permission: LIST_USER_COURSES
   */
  async getAllUserCourses(
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

      const filters: UserCourseFilters = {
        userId: req.query.userId as string,
        courseId: req.query.courseId as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await userCourseService.getAllUserCourses(filters);

      res.status(200).json({
        success: true,
        data: result.userCourses,
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
   * Get user course enrollment by ID
   * GET /api/user-courses/:id
   * Required Permission: VIEW_USER_COURSE
   */
  async getUserCourseById(
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

      const userCourse = await userCourseService.getUserCourseById(id);

      res.status(200).json({
        success: true,
        data: userCourse,
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
   * Enroll a user in a course
   * POST /api/user-courses
   * Required Permission: CREATE_USER_COURSE (User themselves or Admin)
   */
  async createUserCourse(
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

      const createData: CreateUserCourseData = {
        userId: req.body.userId,
        courseId: req.body.courseId,
      };

      if (createData.userId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
        throw new AppError('You can only enroll yourself in a course', 403);
      }

      const userCourse = await userCourseService.createUserCourse(createData);

      res.status(201).json({
        success: true,
        data: userCourse,
        message: 'User enrolled in course successfully',
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
   * Unenroll a user from a course
   * DELETE /api/user-courses/:id
   * Required Permission: DELETE_USER_COURSE (User themselves or Admin)
   */
  async deleteUserCourse(
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

      const existingUserCourse = await userCourseService.getUserCourseById(id);

      if (existingUserCourse.userId !== req.user!.id && req.user!.role !== UserRole.ADMIN) {
        throw new AppError('You can only unenroll yourself from a course', 403);
      }

      const result = await userCourseService.deleteUserCourse(id);

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
   * Check if user course enrollment exists
   * GET /api/user-courses/:id/exists
   * Required Permission: VIEW_USER_COURSE
   */
  async userCourseExists(
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

      const exists = await userCourseService.userCourseExists(id);

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
export const userCourseController = new UserCourseController();
