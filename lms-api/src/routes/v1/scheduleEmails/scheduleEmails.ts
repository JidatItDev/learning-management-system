import { Router } from 'express';
import { scheduleEmailController } from '../../../controllers/scheduleEmailsController';
import {
  authenticate,
  requirePermission,
  PERMISSIONS,
} from '../../../middleware/authenticator';

const scheduleEmailRouter = Router();

// Apply authentication middleware to all routes
scheduleEmailRouter.use(authenticate);

// CRUD routes for scheduled emails with permission checks
scheduleEmailRouter.post(
  '/',
  requirePermission(PERMISSIONS.CREATE_SCHEDULE_EMAIL),
  scheduleEmailController.createScheduleEmail
);
scheduleEmailRouter.get(
  '/',
  requirePermission(PERMISSIONS.LIST_SCHEDULE_EMAILS),
  scheduleEmailController.getAllScheduleEmails
);
scheduleEmailRouter.get(
  '/:id',
  requirePermission(PERMISSIONS.VIEW_SCHEDULE_EMAIL),
  scheduleEmailController.getScheduleEmailById
);
scheduleEmailRouter.put(
  '/:id',
  requirePermission(PERMISSIONS.UPDATE_SCHEDULE_EMAIL),
  scheduleEmailController.updateScheduleEmail
);
scheduleEmailRouter.delete(
  '/:id',
  requirePermission(PERMISSIONS.DELETE_SCHEDULE_EMAIL),
  scheduleEmailController.deleteScheduleEmail
);
scheduleEmailRouter.post(
  '/:id/cancel',
  requirePermission(PERMISSIONS.CANCEL_SCHEDULE_EMAIL),
  scheduleEmailController.cancelScheduleEmail
);

export default scheduleEmailRouter;
