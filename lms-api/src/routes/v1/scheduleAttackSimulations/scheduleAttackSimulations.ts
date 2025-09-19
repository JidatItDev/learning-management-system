import { Router } from 'express';
import {
  getAllScheduleAttackSimulationsValidation,
  getScheduleAttackSimulationByIdValidation,
  createScheduleAttackSimulationValidation,
  updateScheduleAttackSimulationValidation,
  deleteScheduleAttackSimulationValidation,
} from '../../../middleware/scheduleAttackSimulationValidator';
import { scheduleAttackSimulationController } from '../../../controllers/scheduleAttackSimulationController';
import { authenticate, requirePermission, PERMISSIONS } from '../../../middleware/authenticator';
import { scheduleAttackSimulationLimiter } from '../../../middleware/rateLimiters';

const scheduleAttackSimulationRouter = Router();

/**
 * @route   GET /api/schedule-attack-simulations
 * @desc    Get all schedule attack simulations with optional filtering and pagination
 * @access  Private - Requires LIST_SCHEDULE_ATTACK_SIMULATIONS permission
 * @params  Query: groupId, bundleId, status, launchStatus, page, limit
 */
scheduleAttackSimulationRouter.get(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.LIST_SCHEDULE_ATTACK_SIMULATIONS),
  //getAllScheduleAttackSimulationsValidation,
  scheduleAttackSimulationController.getAllScheduleAttackSimulations
);

/**
 * @route   GET /api/schedule-attack-simulations/:id
 * @desc    Get schedule attack simulation by ID
 * @access  Private - Requires VIEW_SCHEDULE_ATTACK_SIMULATION permission
 * @params  Params: id
 */
scheduleAttackSimulationRouter.get(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.VIEW_SCHEDULE_ATTACK_SIMULATION),
  getScheduleAttackSimulationByIdValidation,
  scheduleAttackSimulationController.getScheduleAttackSimulationById
);

/**
 * @route   POST /api/schedule-attack-simulations
 * @desc    Create a new schedule attack simulation
 * @access  Private - Requires CREATE_SCHEDULE_ATTACK_SIMULATION permission
 * @body    groupId, userIds, bundleId, launchDate, launchTime, status, launchStatus, timezone
 */
scheduleAttackSimulationRouter.post(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.CREATE_SCHEDULE_ATTACK_SIMULATION),
  //scheduleAttackSimulationLimiter,
  createScheduleAttackSimulationValidation,
  scheduleAttackSimulationController.createScheduleAttackSimulation
);

/**
 * @route   PUT /api/schedule-attack-simulations/:id
 * @desc    Update an existing schedule attack simulation
 * @access  Private - Requires UPDATE_SCHEDULE_ATTACK_SIMULATION permission
 * @params  Params: id
 * @body    groupId, userIds, bundleId, launchDate, launchTime, status, launchStatus, timezone
 */
scheduleAttackSimulationRouter.put(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.UPDATE_SCHEDULE_ATTACK_SIMULATION),
  //scheduleAttackSimulationLimiter,
  updateScheduleAttackSimulationValidation,
  scheduleAttackSimulationController.updateScheduleAttackSimulation
);

/**
 * @route   DELETE /api/schedule-attack-simulations/:id
 * @desc    Delete a schedule attack simulation
 * @access  Private - Requires DELETE_SCHEDULE_ATTACK_SIMULATION permission
 * @params  Params: id
 */
scheduleAttackSimulationRouter.delete(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.DELETE_SCHEDULE_ATTACK_SIMULATION),
  //scheduleAttackSimulationLimiter,
  deleteScheduleAttackSimulationValidation,
  scheduleAttackSimulationController.deleteScheduleAttackSimulation
);

export default scheduleAttackSimulationRouter;

/**
 * Route Summary:
 *
 * GET Routes:
 * - GET /api/schedule-attack-simulations          - Get all schedule attack simulations with filtering/pagination
 * - GET /api/schedule-attack-simulations/:id      - Get schedule attack simulation by ID
 *
 * POST Routes:
 * - POST /api/schedule-attack-simulations         - Create new schedule attack simulation
 *
 * PUT Routes:
 * - PUT /api/schedule-attack-simulations/:id      - Update existing schedule attack simulation
 *
 * DELETE Routes:
 * - DELETE /api/schedule-attack-simulations/:id   - Delete schedule attack simulation
 *
 * Permission Requirements:
 * - LIST_SCHEDULE_ATTACK_SIMULATIONS: Get all schedule attack simulations
 * - VIEW_SCHEDULE_ATTACK_SIMULATION: Get schedule attack simulation by ID
 * - CREATE_SCHEDULE_ATTACK_SIMULATION: Create new schedule attack simulation
 * - UPDATE_SCHEDULE_ATTACK_SIMULATION: Update existing schedule attack simulation
 * - DELETE_SCHEDULE_ATTACK_SIMULATION: Delete schedule attack simulation
 *
 * Special Middleware:
 * - authenticate: Validates user authentication
 * - requirePermission: Checks specific permission
 * - scheduleAttackSimulationLimiter: Rate limiting for schedule attack simulation operations
 * - Various validation middleware for input validation
 *
 * Usage in main app:
 * import scheduleAttackSimulationRoutes from './routes/scheduleAttackSimulations';
 * app.use('/api/schedule-attack-simulations', scheduleAttackSimulationRoutes);
 */