import { Request, Response, NextFunction } from 'express';
import { CourseFilters, courseService, CreateCourseData, UpdateCourseData } from '../services/courseService/courseService';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, UserRole } from '../middleware/authenticator';
import {  validationResult } from 'express-validator';

export class CourseController {
  /**
   * Get all courses with optional filtering and pagination
   * GET /api/courses
   * Required Permission: LIST_COURSES
   */
  async getAllCourses(
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

      const filters: CourseFilters = {
        title: req.query.title as string,
        description: req.query.description as string,
        createdBy: req.query.createdBy as string,
        bundleId: req.query.bundleId as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      };

      const result = await courseService.getAllCourses(filters);

      res.status(200).json({
        success: true,
        data: result.courses,
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
   * Get course by ID
   * GET /api/courses/:id
   * Required Permission: VIEW_COURSE
   */
  async getCourseById(
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

      const course = await courseService.getCourseById(id);

      res.status(200).json({
        success: true,
        data: course,
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
   * Create a new course
   * POST /api/courses
   * Required Permission: CREATE_COURSE (Admin only)
   */
  async createCourse(
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

      const createData: CreateCourseData = {
        title: req.body.title,
        description: req.body.description,
        createdBy: req.user!.id, // Set creator to current user
      };


      const course = await courseService.createCourse(createData);

      res.status(201).json({
        success: true,
        data: course,
        message: 'Course created successfully',
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
   * Update an existing course
   * PUT /api/courses/:id
   * Required Permission: UPDATE_COURSE
   */
  async updateCourse(
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

      // Verify course exists and requesting user has permission
      const existingCourse = await courseService.getCourseById(id);

      // Only allow updates by creator or admin
      if (
        existingCourse.createdBy !== req.user!.id &&
        req.user!.role !== UserRole.ADMIN
      ) {
        throw new AppError('You can only update courses you created', 403);
      }

      const updateData: UpdateCourseData = {
        title: req.body.title,
        description: req.body.description,
      };

      const course = await courseService.updateCourse(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        data: course,
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
   * Delete a course
   * DELETE /api/courses/:id
   * Required Permission: DELETE_COURSE
   */
  async deleteCourse(
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

      // Verify course exists and requesting user has permission
      const existingCourse = await courseService.getCourseById(id);

      // Only allow deletion by creator or admin
      if (
        existingCourse.createdBy !== req.user!.id &&
        req.user!.role !== UserRole.ADMIN
      ) {
        throw new AppError('You can only delete courses you created', 403);
      }

      const result = await courseService.deleteCourse(id);

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
   * Check if course exists
   * GET /api/courses/:id/exists
   * Required Permission: VIEW_COURSE
   */
  async courseExists(
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

      const exists = await courseService.courseExists(id);

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
   * Get courses created by authenticated user
   * GET /api/courses/my-courses
   * Required Permission: Admin only (since only admins can create courses)
   */
  async getMyCourses(
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

      const filters: CourseFilters = {
        title: req.query.title as string,
        description: req.query.description as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      };

      const result = await courseService.getCoursesByCreator(req.user!.id, filters);

      res.status(200).json({
        success: true,
        data: result.courses,
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
}

// Export singleton instance
export const courseController = new CourseController();