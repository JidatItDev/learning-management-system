import { Router } from 'express';
import { userCourseController } from '../../../controllers/userCourseController';
import {
  authenticate,
  requirePermission,
  PERMISSIONS,
  requireCourseManagementPermission,
} from '../../../middleware/authenticator';
import {
  getAllUserCoursesValidation,
  getUserCourseByIdValidation,
  createUserCourseValidation,
  deleteUserCourseValidation,
} from '../../../middleware/userCourseValidator';
//import { userCourseLimiter } from '../middleware/rateLimiters';

const userCourseRouter = Router();

/**
 * @route   GET /api/user-courses
 * @desc    Get all user-course enrollments with optional filtering and pagination
 * @access  Private - Requires LIST_USER_COURSES permission
 * @query   userId, courseId, page, limit
 */
userCourseRouter.get(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.LIST_USER_COURSES),
  getAllUserCoursesValidation,
  userCourseController.getAllUserCourses
);

/**
 * @route   GET /api/user-courses/:id
 * @desc    Get a single user-course enrollment by ID
 * @access  Private - Requires VIEW_USER_COURSE permission
 */
userCourseRouter.get(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.VIEW_USER_COURSE),
  getUserCourseByIdValidation,
  userCourseController.getUserCourseById
);

/**
 * @route   POST /api/user-courses
 * @desc    Create a new user-course enrollment
 * @access  Private - Admin or User (for self-enrollment)
 */
userCourseRouter.post(
  '/',
  authenticate,
  //requireCourseManagementPermission,
  //userCourseLimiter,
  createUserCourseValidation,
  userCourseController.createUserCourse
);

/**
 * @route   DELETE /api/user-courses/:id
 * @desc    Delete a user-course enrollment
 * @access  Private - Admin only
 */
userCourseRouter.delete(
  '/:id',
  authenticate,
  //requireCourseManagementPermission,
  //userCourseLimiter,
  deleteUserCourseValidation,
  userCourseController.deleteUserCourse
);

/**
 * @route   GET /api/user-courses/:id/exists
 * @desc    Check if user-course enrollment exists
 * @access  Private - Requires VIEW_USER_COURSE permission
 */
userCourseRouter.get(
  '/:id/exists',
  authenticate,
  //requirePermission(PERMISSIONS.VIEW_USER_COURSE),
  getUserCourseByIdValidation,
  userCourseController.userCourseExists
);

export default userCourseRouter;
