import { Router } from 'express';
import { courseController } from '../../../controllers/courseController';
import {
  authenticate,
  requirePermission,
  PERMISSIONS,
  requireCourseCreationPermission,
  requireCourseManagementPermission,
} from '../../../middleware/authenticator';



// Import validation middleware (you'll need to create these)
import {
  getAllCoursesValidation,
  getCourseByIdValidation,
  createCourseValidation,
  updateCourseValidation,
  deleteCourseValidation,
} from '../../../middleware/courseValidator';

// Import rate limiter (you'll need to create this)
import { courseLimiter } from '../../../middleware/rateLimiters';

const courseRouter = Router();

/**
 * @route   GET /api/courses/my-courses
 * @desc    Get courses created by authenticated user
 * @access  Private - Admin only
 */
courseRouter.get(
  '/my-courses',
  authenticate,
  requireCourseCreationPermission, // Only admins can create courses, so only they have "my courses"
  getAllCoursesValidation,
  courseController.getMyCourses
);

/**
 * @route   GET /api/courses
 * @desc    Get all courses with optional filtering and pagination
 * @access  Private - Requires LIST_COURSES permission
 * @query   title, description, createdBy, page, limit
 */
courseRouter.get(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.LIST_COURSES),
  getAllCoursesValidation,
  courseController.getAllCourses
);

/**
 * @route   GET /api/courses/:id
 * @desc    Get a single course by ID
 * @access  Private - Requires VIEW_COURSE permission
 */
courseRouter.get(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_COURSE),
  getCourseByIdValidation,
  courseController.getCourseById
);

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private - Admin only
 */
courseRouter.post(
  '/',
  authenticate,
  requireCourseCreationPermission,
  courseLimiter,
  createCourseValidation,
  courseController.createCourse
);

/**
 * @route   PUT /api/courses/:id
 * @desc    Update an existing course
 * @access  Private - Admin only (or course creator)
 */
courseRouter.put(
  '/:id',
  authenticate,
  requireCourseManagementPermission,
  courseLimiter,
  updateCourseValidation,
  courseController.updateCourse
);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete a course
 * @access  Private - Admin only (or course creator)
 */
courseRouter.delete(
  '/:id',
  authenticate,
  requireCourseManagementPermission,
  courseLimiter,
  deleteCourseValidation,
  courseController.deleteCourse
);

/**
 * @route   GET /api/courses/:id/exists
 * @desc    Check if course exists
 * @access  Private - Requires VIEW_COURSE permission
 */
courseRouter.get(
  '/:id/exists',
  authenticate,
  requirePermission(PERMISSIONS.VIEW_COURSE),
  getCourseByIdValidation,
  courseController.courseExists
);

/**
 * Route Summary:
 *
 * GET Routes:
 * - GET /api/courses                - Get all courses (All authenticated users)
 * - GET /api/courses/:id            - Get a single course (All authenticated users)
 * - GET /api/courses/:id/exists     - Check if course exists (All authenticated users)
 *
 * POST Routes:
 * - POST /api/courses               - Create a new course (Admin only)
 *
 * PUT Routes:
 * - PUT /api/courses/:id            - Update an existing course (Admin only)
 *
 * DELETE Routes:
 * - DELETE /api/courses/:id         - Delete a course (Admin only)
 *
 * Permission Requirements:
 * - LIST_COURSES: All roles can view courses
 * - VIEW_COURSE: All roles can view individual courses
 * - CREATE_COURSE: Admin only
 * - UPDATE_COURSE: Admin only (or course creator via controller logic)
 * - DELETE_COURSE: Admin only (or course creator via controller logic)
 *
 * Middleware Stack:
 * - authenticate: Validates user authentication
 * - requirePermission: Checks specific permission
 * - requireCourseCreationPermission: Admin-only course creation
 * - requireCourseManagementPermission: Admin-only course management
 * - courseLimiter: Rate limiting for course operations
 * - Validation middleware: Input validation for each route
 *
 * Dependencies needed:
 * - courseValidator middleware
 * - courseLimiter rate limiter
 *
 * Usage in main app:
 * import courseRoutes from './routes/courseRoutes';
 * app.use('/api/courses', courseRoutes);
 */

export default courseRouter;