import { Request, Response, NextFunction } from 'express';
import { emailTemplateService } from '../services/emailTemplateService/emailTemplateService';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/authenticator';

export class EmailTemplateController {
  // Create a new email template (Admin and Contributor)
  async createEmailTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, type, subject, body } = req.body;
      
      if (!name || !type || !subject || !body) {
        throw new AppError('Name, type, subject, and body are required', 400);
      }

      const template = await emailTemplateService.createEmailTemplate({
        name,
        type,
        subject,
        body,      
    });

      res.status(201).json({
        success: true,
        data: template,
        message: 'Email template created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all email templates with pagination and filtering
  async getAllEmailTemplates(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, name, type, isActive } = req.query;
      
      const templates = await emailTemplateService.getAllEmailTemplates({
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        name: name as string,
        type: type as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });

      res.json({
        success: true,
        data: templates.templates,
        pagination: {
          total: templates.total,
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10,
          totalPages: Math.ceil(templates.total / (limit ? parseInt(limit as string) : 10)),
        },
        message: 'Email templates retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a single email template by ID
  async getEmailTemplateById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const template = await emailTemplateService.getEmailTemplateById(id);
      
      res.json({
        success: true,
        data: template,
        message: 'Email template retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a single email template by name
  async getEmailTemplateByName(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.params;
      const template = await emailTemplateService.getTemplateByName(name);
      
      res.json({
        success: true,
        data: template,
        message: 'Email template retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Update an email template
  async updateEmailTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { subject, body } = req.body;
      
      if (!subject && !body) {
        throw new AppError('At least one field (subject, body) must be provided for update', 400);
      }

      const template = await emailTemplateService.updateEmailTemplate(id, {
        subject,
        body,
      });

      res.json({
        success: true,
        data: template,
        message: 'Email template updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Toggle email template status
  async toggleEmailTemplateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const template = await emailTemplateService.toggleTemplateStatus(id, req.user!.id);

      res.json({
        success: true,
        data: template,
        message: `Email template ${template.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  // Soft delete an email template
  async deleteEmailTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await emailTemplateService.deleteEmailTemplate(id, req.user!.id);
      
      res.json({
        success: true,
        message: 'Email template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get available template types
  async getTemplateTypes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = await emailTemplateService.getAvailableTemplateTypes();
      
      res.json({
        success: true,
        data: types,
        message: 'Template types retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const emailTemplateController = new EmailTemplateController();