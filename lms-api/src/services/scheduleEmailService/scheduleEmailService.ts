import { Op } from 'sequelize';
import ScheduleEmail, {
  ScheduleStatus,
} from '../../models/scheduleEmails/scheduleEmails';
import EmailTemplate from '../../models/emailTemplates/emailTemplates';
import User from '../../models/users/users';
import { AppError } from '../../middleware/errorHandler';
import {
  CreateScheduleEmailDTO,
  UpdateScheduleEmailDTO,
  ScheduleEmailQuery,
} from './scheduleEmail.interface';
import { validate as uuidValidate } from 'uuid';
import { ScheduleEmailRecipient, sequelize } from '../../models';

class ScheduleEmailService {
  // Create a new scheduled email
  async createScheduleEmail(
    data: CreateScheduleEmailDTO
  ): Promise<ScheduleEmail> {
    const transaction = await sequelize.transaction();

    try {
      const {
        templateId,
        customSubject,
        recipientIds,
        status = ScheduleStatus.DRAFT,
        createdBy,
        scheduledAt,
      } = data;

      // Validate template
      const template = await EmailTemplate.findByPk(templateId);
      if (!template) {
        throw new AppError('Email template not found', 404);
      }
      if (!template.isActive) {
        throw new AppError('Cannot schedule email with inactive template', 400);
      }

      // Validate creator
      const user = await User.findByPk(createdBy);
      if (!user) {
        throw new AppError('Creating user not found', 400);
      }

      // Validate recipientIds and users
      let validatedUsers = [];
      if (recipientIds && recipientIds.length > 0) {
        for (const id of recipientIds) {
          if (!uuidValidate(id)) {
            throw new AppError(`Invalid UUID in recipientIds: ${id}`, 400);
          }
          const recipient = await User.findByPk(id);
          if (!recipient) {
            throw new AppError(`Recipient user not found: ${id}`, 404);
          }
          if (!recipient.isActive) {
            throw new AppError(
              `Cannot schedule email to inactive user: ${id}`,
              400
            );
          }
          validatedUsers.push(recipient);
        }
      }

      // Validate scheduledAt
      if (!scheduledAt || isNaN(scheduledAt.getTime())) {
        throw new AppError('Invalid scheduledAt date', 400);
      }

      // Create the schedule email (without recipientIds in JSON)
      const scheduleEmail = await ScheduleEmail.create(
        {
          templateId,
          customSubject,
          status,
          createdBy,
          scheduledAt,
        },
        { transaction }
      );

      // Create junction table records for recipients
      if (validatedUsers.length > 0) {
        const recipientRecords = validatedUsers.map((user) => ({
          scheduleEmailId: scheduleEmail.id,
          userId: user.id,
        }));

        await ScheduleEmailRecipient.bulkCreate(recipientRecords, {
          transaction,
        });
      }

      await transaction.commit();

      // Return the created email with populated associations
      return await this.getScheduleEmailById(scheduleEmail.id);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create scheduled email', 500);
    }
  }

  // Get all scheduled emails with pagination and filtering
  async getAllScheduleEmails(
    query: ScheduleEmailQuery
  ): Promise<{ schedules: ScheduleEmail[]; total: number }> {
    try {
      const { page = 1, limit = 10, status, createdBy } = query;
      const offset = (page - 1) * limit;
      const where: any = {};
      if (status) where.status = status;
      if (createdBy) where.createdBy = createdBy;

      const { rows, count } = await ScheduleEmail.findAndCountAll({
        where,
        include: [
          { model: EmailTemplate, as: 'template' },
          {
            model: User,
            as: 'recipientUsers',
            attributes: ['id', 'email', 'firstName', 'lastName', 'isActive'],
          },
          {
            model: User,
            as: 'createdByUser',
            attributes: ['id', 'email', 'firstName', 'lastName'],
          },
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return { schedules: rows, total: count };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve scheduled emails', 500);
    }
  }

  // Get a single scheduled email by ID
  async getScheduleEmailById(id: string): Promise<ScheduleEmail> {
    try {
      const schedule = await ScheduleEmail.findByPk(id, {
        include: [
          { model: EmailTemplate, as: 'template' },
          {
            model: User,
            as: 'recipientUsers',
            attributes: ['id', 'email', 'firstName', 'lastName', 'isActive'],
          },
          {
            model: User,
            as: 'createdByUser',
            attributes: ['id', 'email', 'firstName', 'lastName', 'isActive'],
          },
        ],
      });
      if (!schedule) {
        throw new AppError('Scheduled email not found', 404);
      }
      return schedule;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve scheduled email', 500);
    }
  }

  // Update a scheduled email
  async updateScheduleEmail(
    id: string,
    data: UpdateScheduleEmailDTO
  ): Promise<ScheduleEmail> {
    const transaction = await sequelize.transaction();

    try {
      const schedule = await ScheduleEmail.findByPk(id, { transaction });
      if (!schedule) {
        throw new AppError('Scheduled email not found', 404);
      }

      const updateData: any = {};
      if (data.customSubject) updateData.customSubject = data.customSubject;
      if (data.status) {
        if (
          ![
            ScheduleStatus.DRAFT,
            ScheduleStatus.SCHEDULED,
            ScheduleStatus.CANCELLED,
          ].includes(data.status)
        ) {
          throw new AppError(
            'Invalid status. Must be draft, scheduled, or cancelled',
            400
          );
        }
        updateData.status = data.status;
      }
      if (data.scheduledAt) {
        if (isNaN(data.scheduledAt.getTime())) {
          throw new AppError('Invalid scheduledAt date', 400);
        }
        updateData.scheduledAt = data.scheduledAt;
      }

      // Update recipients if provided
      if (data.recipientIds) {
        if (!Array.isArray(data.recipientIds)) {
          throw new AppError('recipientIds must be an array of UUIDs', 400);
        }

        // Validate new recipients
        let validatedUsers = [];
        for (const userId of data.recipientIds) {
          if (!uuidValidate(userId)) {
            throw new AppError(`Invalid UUID in recipientIds: ${userId}`, 400);
          }
          const recipient = await User.findByPk(userId);
          if (!recipient) {
            throw new AppError(`Recipient user not found: ${userId}`, 404);
          }
          if (!recipient.isActive) {
            throw new AppError(
              `Cannot schedule email to inactive user: ${userId}`,
              400
            );
          }
          validatedUsers.push(recipient);
        }

        // Remove existing recipients
        await ScheduleEmailRecipient.destroy({
          where: { scheduleEmailId: id },
          transaction,
        });

        // Add new recipients
        if (validatedUsers.length > 0) {
          const recipientRecords = validatedUsers.map((user) => ({
            scheduleEmailId: id,
            userId: user.id,
          }));

          await ScheduleEmailRecipient.bulkCreate(recipientRecords, {
            transaction,
          });
        }
      }

      await schedule.update(updateData, { transaction });
      await transaction.commit();

      return await this.getScheduleEmailById(id);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update scheduled email', 500);
    }
  }

  // Delete a scheduled email
  async deleteScheduleEmail(id: string): Promise<void> {
    try {
      const schedule = await ScheduleEmail.findByPk(id);
      if (!schedule) {
        throw new AppError('Scheduled email not found', 404);
      }
      await schedule.destroy();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete scheduled email', 500);
    }
  }

  // Cancel a scheduled email
  async cancelScheduleEmail(id: string): Promise<ScheduleEmail> {
    try {
      const schedule = await ScheduleEmail.findByPk(id);
      if (!schedule) {
        throw new AppError('Scheduled email not found', 404);
      }
      if (
        schedule.status === ScheduleStatus.SENT ||
        schedule.status === ScheduleStatus.FAILED
      ) {
        throw new AppError('Cannot cancel a sent or failed email', 400);
      }
      await schedule.update({ status: ScheduleStatus.CANCELLED });
      return schedule;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to cancel scheduled email', 500);
    }
  }

  // Get pending scheduled emails for cron job
  async getPendingScheduleEmails(
    upToDate: Date = new Date()
  ): Promise<ScheduleEmail[]> {
    try {
      return await ScheduleEmail.findAll({
        where: {
          status: [ScheduleStatus.DRAFT, ScheduleStatus.SCHEDULED, ScheduleStatus.FAILED],
          scheduledAt: { [Op.lte]: upToDate },
        },
        include: [
          { model: EmailTemplate, as: 'template' },
          {
            model: User,
            as: 'createdByUser',
            attributes: ['id', 'email', 'firstName', 'lastName'],
          },
          {
            model: User,
            as: 'recipientUsers',
            attributes: ['id', 'email', 'firstName', 'lastName', 'isActive'],
          },
        ],
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve pending scheduled emails', 500);
    }
  }
}

export const scheduleEmailService = new ScheduleEmailService();
