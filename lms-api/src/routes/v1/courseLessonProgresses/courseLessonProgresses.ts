import { Router } from 'express';
import { courseLessonProgressController } from '../../../controllers/courseLessonProgressController';
import {
  authenticate,
  requirePermission,
  PERMISSIONS,
  requireCourseManagementPermission,
} from '../../../middleware/authenticator';
import {
  getAllProgressValidation,
  getProgressByIdValidation,
  createProgressValidation,
  updateProgressValidation,
  deleteProgressValidation,
} from '../../../middleware/courseLessonProgressValidator';
//import { progressLimiter } from '../middleware/rateLimiters';

const progressRouter = Router();

/**
 * @route   GET /api/course-lesson-progress
 * @desc    Get all progress records with optional filtering and pagination
 * @access  Private - Requires LIST_PROGRESS permission
 * @query   userId, lessonId, courseId, isCompleted, page, limit
 */
progressRouter.get(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.LIST_PROGRESS),
  getAllProgressValidation,
  courseLessonProgressController.getAllProgress
);

/**
 * @route   GET /api/course-lesson-progress/my-progress
 * @desc    Get progress for authenticated user
 * @access  Private - Requires LIST_PROGRESS permission
 * @query   lessonId, courseId, isCompleted, page, limit
 */
progressRouter.get(
  '/my-progress',
  authenticate,
  //requirePermission(PERMISSIONS.LIST_PROGRESS),
  getAllProgressValidation,
  courseLessonProgressController.getMyProgress
);

/**
 * @route   GET /api/course-lesson-progress/:id
 * @desc    Get a single progress record by ID
 * @access  Private - Requires VIEW_PROGRESS permission
 */
progressRouter.get(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.VIEW_PROGRESS),
  getProgressByIdValidation,
  courseLessonProgressController.getProgressById
);

/**
 * @route   POST /api/course-lesson-progress
 * @desc    Create a new progress record
 * @access  Private - Admin or User (for own progress)
 */
progressRouter.post(
  '/',
  authenticate,
  //requireCourseManagementPermission,
  //progressLimiter,
  createProgressValidation,
  courseLessonProgressController.createProgress
);

/**
 * @route   PUT /api/course-lesson-progress/:id
 * @desc    Update an existing progress record
 * @access  Private - Admin or User (for own progress)
 */
progressRouter.put(
  '/:id',
  authenticate,
  //requireCourseManagementPermission,
  //progressLimiter,
  updateProgressValidation,
  courseLessonProgressController.updateProgress
);

/**
 * @route   DELETE /api/course-lesson-progress/:id
 * @desc    Delete a progress record
 * @access  Private - Admin only
 */
progressRouter.delete(
  '/:id',
  authenticate,
  //requireCourseManagementPermission,
  //progressLimiter,
  deleteProgressValidation,
  courseLessonProgressController.deleteProgress
);

/**
 * @route   GET /api/course-lesson-progress/:id/exists
 * @desc    Check if progress record exists
 * @access  Private - Requires VIEW_PROGRESS permission
 */
progressRouter.get(
  '/:id/exists',
  authenticate,
  //requirePermission(PERMISSIONS.VIEW_PROGRESS),
  getProgressByIdValidation,
  courseLessonProgressController.progressExists
);

export default progressRouter;
