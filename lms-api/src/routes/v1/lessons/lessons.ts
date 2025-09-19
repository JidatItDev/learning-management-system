import { Router } from 'express';
import { lessonController } from '../../../controllers/lessonController';
import {
  authenticate,
  requirePermission,
  PERMISSIONS,
  requireCourseCreationPermission,
  requireCourseManagementPermission,
} from '../../../middleware/authenticator';
import {
  getAllLessonsValidation,
  getLessonsByCourseValidation,
  getLessonByIdValidation,
  createLessonValidation,
  updateLessonValidation,
  deleteLessonValidation,
} from '../../../middleware/lessonValidator';
//import { lessonLimiter } from '../middleware/rateLimiters';

const lessonRouter = Router();

/**
 * @route   GET /api/lessons
 * @desc    Get all lessons with optional filtering and pagination
 * @access  Private - Requires LIST_LESSONS permission
 * @query   courseId, title, description, videoUrl, createdBy, page, limit
 */
lessonRouter.get(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.LIST_LESSONS),
  getAllLessonsValidation,
  lessonController.getAllLessons
);

/**
 * @route   GET /api/lessons/course/:courseId
 * @desc    Get lessons by course ID
 * @access  Private - Requires LIST_LESSONS permission
 * @query   title, description, videoUrl, createdBy, page, limit
 */
lessonRouter.get(
  '/course/:courseId',
  authenticate,
  //requirePermission(PERMISSIONS.LIST_LESSONS),
  getLessonsByCourseValidation,
  lessonController.getLessonsByCourse
);

/**
 * @route   GET /api/lessons/:id
 * @desc    Get a single lesson by ID
 * @access  Private - Requires VIEW_LESSON permission
 */
lessonRouter.get(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.VIEW_LESSON),
  getLessonByIdValidation,
  lessonController.getLessonById
);

/**
 * @route   POST /api/lessons
 * @desc    Create a new lesson
 * @access  Private - Admin or Course Creator
 */
lessonRouter.post(
  '/',
  authenticate,
  //requireCourseCreationPermission,
  //lessonLimiter,
  createLessonValidation,
  lessonController.createLesson
);

/**
 * @route   PUT /api/lessons/:id
 * @desc    Update an existing lesson
 * @access  Private - Admin or Lesson Creator
 */
lessonRouter.put(
  '/:id',
  authenticate,
  //requireCourseManagementPermission,
  //lessonLimiter,
  updateLessonValidation,
  lessonController.updateLesson
);

/**
 * @route   DELETE /api/lessons/:id
 * @desc    Delete a lesson
 * @access  Private - Admin or Lesson Creator
 */
lessonRouter.delete(
  '/:id',
  authenticate,
  //requireCourseManagementPermission,
  //lessonLimiter,
  deleteLessonValidation,
  lessonController.deleteLesson
);

/**
 * @route   GET /api/lessons/:id/exists
 * @desc    Check if lesson exists
 * @access  Private - Requires VIEW_LESSON permission
 */
lessonRouter.get(
  '/:id/exists',
  authenticate,
  //requirePermission(PERMISSIONS.VIEW_LESSON),
  getLessonByIdValidation,
  lessonController.existingLesson
);

export default lessonRouter;
