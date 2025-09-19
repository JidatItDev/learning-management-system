'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ScheduleEmailRecipients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      scheduleEmailId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ScheduleEmails', // must match your ScheduleEmails table name
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users', // must match your Users table name
          key: 'id',
        },
        onDelete: 'CASCADE',
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

    // Add indices
    await queryInterface.addIndex('ScheduleEmailRecipients', ['scheduleEmailId', 'userId'], {
      name: 'idx_schedule_email_recipients_unique',
      unique: true,
    });

    await queryInterface.addIndex('ScheduleEmailRecipients', ['scheduleEmailId'], {
      name: 'idx_schedule_email_recipients_schedule_id',
    });

    await queryInterface.addIndex('ScheduleEmailRecipients', ['userId'], {
      name: 'idx_schedule_email_recipients_user_id',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('ScheduleEmailRecipients', 'idx_schedule_email_recipients_unique');
    await queryInterface.removeIndex('ScheduleEmailRecipients', 'idx_schedule_email_recipients_schedule_id');
    await queryInterface.removeIndex('ScheduleEmailRecipients', 'idx_schedule_email_recipients_user_id');
    await queryInterface.dropTable('ScheduleEmailRecipients');
  },
};
