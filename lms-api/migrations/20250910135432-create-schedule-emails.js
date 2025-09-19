'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ScheduleEmails', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      templateId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'EmailTemplates',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      customSubject: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      recipientIds: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: Sequelize.ENUM('draft', 'scheduled', 'sent', 'cancelled', 'failed'),
        allowNull: false,
        defaultValue: 'draft',
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      scheduledAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('ScheduleEmails', ['templateId'], {
      name: 'idx_schedule_emails_template_id',
    });
    await queryInterface.addIndex('ScheduleEmails', ['createdBy'], {
      name: 'idx_schedule_emails_created_by',
    });
    await queryInterface.addIndex('ScheduleEmails', ['status'], {
      name: 'idx_schedule_emails_status',
    });
    await queryInterface.addIndex('ScheduleEmails', ['scheduledAt'], {
      name: 'idx_schedule_emails_scheduled_at',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('ScheduleEmails', 'idx_schedule_emails_template_id');
    await queryInterface.removeIndex('ScheduleEmails', 'idx_schedule_emails_created_by');
    await queryInterface.removeIndex('ScheduleEmails', 'idx_schedule_emails_status');
    await queryInterface.removeIndex('ScheduleEmails', 'idx_schedule_emails_scheduled_at');
    await queryInterface.dropTable('ScheduleEmails');
  },
};