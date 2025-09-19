import { NextFunction, Response, Router } from 'express';
import { emailTemplateController } from '../../../controllers/emailTemplateController';
import {
  authenticate,
  requirePermission,
  requireRole,
  PERMISSIONS,
  UserRole,
  AuthenticatedRequest,
} from '../../../middleware/authenticator';
import { AppError } from '../../../middleware/errorHandler';
import { emailTemplateService } from '../../../services/emailTemplateService/emailTemplateService';

const emailTemplateRouter = Router();

// Apply authentication middleware to all routes
emailTemplateRouter.use(authenticate);

// CRUD routes for email templates with permission checks
emailTemplateRouter.post(
  '/',
  requirePermission(PERMISSIONS.CREATE_EMAIL_TEMPLATE),
  emailTemplateController.createEmailTemplate.bind(emailTemplateController)
);

emailTemplateRouter.get(
  '/',
  requirePermission(PERMISSIONS.LIST_EMAIL_TEMPLATES),
  emailTemplateController.getAllEmailTemplates.bind(emailTemplateController)
);

emailTemplateRouter.get(
  '/types',
  requireRole([UserRole.ADMIN, UserRole.CONTRIBUTOR]),
  emailTemplateController.getTemplateTypes.bind(emailTemplateController)
);

emailTemplateRouter.get(
  '/name/:name',
  requirePermission(PERMISSIONS.VIEW_EMAIL_TEMPLATE),
  emailTemplateController.getEmailTemplateByName.bind(emailTemplateController)
);

emailTemplateRouter.get(
  '/:id',
  requirePermission(PERMISSIONS.VIEW_EMAIL_TEMPLATE),
  emailTemplateController.getEmailTemplateById.bind(emailTemplateController)
);

emailTemplateRouter.put(
  '/:id',
  requirePermission(PERMISSIONS.UPDATE_EMAIL_TEMPLATE),
  emailTemplateController.updateEmailTemplate.bind(emailTemplateController)
);

emailTemplateRouter.patch(
  '/:id/toggle-status',
  requireRole([UserRole.ADMIN]), // Only admins can toggle status
  emailTemplateController.toggleEmailTemplateStatus.bind(emailTemplateController)
);

emailTemplateRouter.delete(
  '/:id',
  requirePermission(PERMISSIONS.DELETE_EMAIL_TEMPLATE),
  emailTemplateController.deleteEmailTemplate.bind(emailTemplateController)
);

emailTemplateRouter.post(
  '/:id/render',
  requirePermission(PERMISSIONS.RENDER_EMAIL_TEMPLATE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { variables } = req.body;
      
      if (!variables || typeof variables !== 'object') {
        throw new AppError('Variables object is required for rendering', 400);
      }

      const rendered = await emailTemplateService.renderTemplate(id, variables);
      
      res.json({
        success: true,
        data: rendered,
        message: 'Template rendered successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

emailTemplateRouter.post(
  '/name/:name/render',
  requirePermission(PERMISSIONS.RENDER_EMAIL_TEMPLATE),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;
      const { variables } = req.body;
      
      if (!variables || typeof variables !== 'object') {
        throw new AppError('Variables object is required for rendering', 400);
      }

      const rendered = await emailTemplateService.renderTemplateByName(name, variables);
      
      res.json({
        success: true,
        data: rendered,
        message: 'Template rendered successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

emailTemplateRouter.get(
  '/stats',
  requirePermission(PERMISSIONS.VIEW_EMAIL_TEMPLATE_STATS),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await emailTemplateService.getTemplateStats();
      
      res.json({
        success: true,
        data: stats,
        message: 'Template statistics retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default emailTemplateRouter;
