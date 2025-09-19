import EmailTemplate from '../../models/emailTemplates/emailTemplates';
import { AppError } from '../../middleware/errorHandler';
import {
  CreateEmailTemplateData,
  EmailTemplateFilters,
  UpdateEmailTemplateData,
  TemplateRenderData,
} from './emailTemplate.interface';
import { Op } from 'sequelize';

class EmailTemplateService {
  // Create a new email template
  async createEmailTemplate(data: CreateEmailTemplateData): Promise<EmailTemplate> {
    const { name, type, subject, body, isActive = true } = data;

    // Check for existing template with same name (excluding soft-deleted)
    const existingTemplate = await EmailTemplate.findOne({
      where: {
        name,
      },
    });

    if (existingTemplate) {
      throw new AppError(`Email template with name '${name}' already exists`, 400);
    }

    return EmailTemplate.create({
      name,
      type,
      subject,
      body,
      isActive,
    });
  }

  // Get all email templates with pagination and filtering
  async getAllEmailTemplates(query: EmailTemplateFilters): Promise<{ templates: EmailTemplate[]; total: number }> {
    const { page = 1, limit = 10, name, type, isActive } = query;
    const offset = (page - 1) * limit;
    const where: any = {};

    if (name) {
      where.name = { [Op.iLike]: `%${name}%` };
    }
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    const { rows, count } = await EmailTemplate.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return { templates: rows, total: count };
  }

  // Get a single email template by ID
  async getEmailTemplateById(id: string): Promise<EmailTemplate> {
    const template = await EmailTemplate.findOne({
      where: {
        id,
      },
    });

    if (!template) {
      throw new AppError(`Email template with ID '${id}' not found`, 404);
    }

    return template;
  }

  // Get a single email template by name
  async getTemplateByName(name: string): Promise<EmailTemplate> {
    const template = await EmailTemplate.findOne({
      where: {
        name,
      },
    });

    if (!template) {
      throw new AppError(`Email template with name '${name}' not found`, 404);
    }

    return template;
  }

  // Update an email template
  async updateEmailTemplate(id: string, data: UpdateEmailTemplateData): Promise<EmailTemplate> {
    const template = await this.getEmailTemplateById(id);

    const updateData: any = {};
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.body !== undefined) updateData.body = data.body;

    await template.update(updateData);
    return template;
  }

  // Toggle template status
  async toggleTemplateStatus(id: string, updatedBy: string): Promise<EmailTemplate> {
    const template = await this.getEmailTemplateById(id);

    await template.update({
      isActive: !template.isActive,
    });

    return template;
  }

  // Soft delete an email template
  async deleteEmailTemplate(id: string, deletedBy: string): Promise<void> {
    const template = await this.getEmailTemplateById(id);

    // If you want to implement soft delete, add a deletedAt field in your model
    // For now, just destroy
    await template.destroy();
  }

  // Get available template types
  async getAvailableTemplateTypes(): Promise<{ types: string[] }> {
    // You may want to define these types somewhere central
    const types = [
      'WELCOME',
      'PASSWORD_RESET',
      'OTP',
      'NOTIFICATION',
      'COURSE_ASSIGNMENT',
      'GROUP_INVITATION',
    ];
    return { types };
  }

  // Render template with variables (simple replace)
  async renderTemplate(templateId: string, variables: Record<string, string>): Promise<TemplateRenderData> {
    const template = await this.getEmailTemplateById(templateId);

    if (!template.isActive) {
      throw new AppError(`Email template '${template.name}' is not active`, 400);
    }

    return {
      subject: this.replaceVariables(template.subject, variables),
      body: this.replaceVariables(template.body, variables),
    };
  }

  // Render template by name with variables
  async renderTemplateByName(name: string, variables: Record<string, string>): Promise<TemplateRenderData> {
    const template = await this.getTemplateByName(name);

    if (!template.isActive) {
      throw new AppError(`Email template '${template.name}' is not active`, 400);
    }

    return {
      subject: this.replaceVariables(template.subject, variables),
      body: this.replaceVariables(template.body, variables),
    };
  }

  // Simple variable replacement
  private replaceVariables(content: string, variables: Record<string, string>): string {
    return content.replace(/\{\{([^}]+)\}\}/g, (_, key) => variables[key.trim()] ?? '');
  }

  // Get templates by multiple types
  async getTemplatesByTypes(types: string[]): Promise<EmailTemplate[]> {
    return EmailTemplate.findAll({
      where: {
        type: { [Op.in]: types },
        isActive: true,
      },
      order: [['type', 'ASC'], ['createdAt', 'DESC']],
    });
  }

  // Get template statistics
  async getTemplateStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
  }> {
    const templates = await EmailTemplate.findAll({
      attributes: ['type', 'isActive'],
    });

    const stats = {
      total: templates.length,
      active: templates.filter((t: EmailTemplate) => t.isActive).length,
      inactive: templates.filter((t: EmailTemplate) => !t.isActive).length,
      byType: {} as Record<string, number>,
    };

    templates.forEach((template: EmailTemplate) => {
      stats.byType[template.type] = (stats.byType[template.type] || 0) + 1;
    });

    return stats;
  }
}

export const emailTemplateService = new EmailTemplateService();