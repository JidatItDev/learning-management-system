import { Router } from 'express';
//import { attackSimulationController } from '../../../src/controllers/attackSimulationController';
import { attackSimulationController } from '../../../controllers/attackSimulationController';
import { authenticate, requirePermission, UserRole } from '../../../middleware/authenticator';
import {
  getAllAttackSimulationsValidation,
  getAttackSimulationByIdValidation,
  createAttackSimulationValidation,
  updateAttackSimulationValidation,
  deleteAttackSimulationValidation,
} from '../../../middleware/attackSimulationValidator';

const attackSimulationRouter = Router();

// Routes
attackSimulationRouter.get(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.LIST_ATTACK_SIMULATIONS),
  getAllAttackSimulationsValidation,
  attackSimulationController.getAllAttackSimulations
);

attackSimulationRouter.get(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.VIEW_ATTACK_SIMULATION),
  getAttackSimulationByIdValidation,
  attackSimulationController.getAttackSimulationById
);

attackSimulationRouter.post(
  '/',
  authenticate,
  //requirePermission(PERMISSIONS.CREATE_ATTACK_SIMULATION, [UserRole.ADMIN, UserRole.CONTRIBUTOR]),
  createAttackSimulationValidation,
  attackSimulationController.createAttackSimulation
);

attackSimulationRouter.put(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.UPDATE_ATTACK_SIMULATION),
  updateAttackSimulationValidation,
  attackSimulationController.updateAttackSimulation
);

attackSimulationRouter.delete(
  '/:id',
  authenticate,
  //requirePermission(PERMISSIONS.DELETE_ATTACK_SIMULATION, [UserRole.ADMIN, UserRole.CONTRIBUTOR]),
  deleteAttackSimulationValidation,
  attackSimulationController.deleteAttackSimulation
);

attackSimulationRouter.get(
  '/:id/exists',
  authenticate,
  //requirePermission(PERMISSIONS.VIEW_ATTACK_SIMULATION),
  getAttackSimulationByIdValidation,
  attackSimulationController.attackSimulationExists
);

export default attackSimulationRouter;