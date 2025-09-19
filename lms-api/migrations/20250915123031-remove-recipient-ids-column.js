'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      console.log('Starting migration to remove recipientIds column...');

      // First, check if the recipientIds column exists
      const tableInfo = await queryInterface.describeTable('ScheduleEmails');
      if (!tableInfo.recipientIds) {
        console.log('recipientIds column does not exist, skipping migration');
        return;
      }

      // Get existing data from recipientIds column (using proper MySQL JSON syntax)
      const scheduleEmails = await queryInterface.sequelize.query(
        `SELECT id, recipientIds FROM ScheduleEmails WHERE recipientIds IS NOT NULL AND JSON_LENGTH(recipientIds) > 0`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(
        `Found ${scheduleEmails.length} schedule emails with recipientIds to migrate`
      );

      // Create junction table records for existing data
      for (const schedule of scheduleEmails) {
        if (schedule.recipientIds) {
          try {
            // Parse the JSON array
            const recipientIds =
              typeof schedule.recipientIds === 'string'
                ? JSON.parse(schedule.recipientIds)
                : schedule.recipientIds;

            if (Array.isArray(recipientIds) && recipientIds.length > 0) {
              const junctionRecords = recipientIds.map((userId) => ({
                id: require('uuid').v4(),
                scheduleEmailId: schedule.id,
                userId: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
              }));

              await queryInterface.bulkInsert(
                'ScheduleEmailRecipients',
                junctionRecords
              );
              console.log(
                `Migrated ${junctionRecords.length} recipients for schedule ${schedule.id}`
              );
            }
          } catch (parseError) {
            console.warn(
              `Failed to parse recipientIds for schedule ${schedule.id}:`,
              parseError
            );
          }
        }
      }

      // Now remove the recipientIds column
      await queryInterface.removeColumn('ScheduleEmails', 'recipientIds');
      console.log('Successfully removed recipientIds column');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      console.log('Rolling back: Re-adding recipientIds column...');

      // Re-add the recipientIds column
      await queryInterface.addColumn('ScheduleEmails', 'recipientIds', {
        type: Sequelize.JSON,
        allowNull: true,
      });

      // Migrate data back from junction table to recipientIds column
      const junctionData = await queryInterface.sequelize.query(
        `
        SELECT 
          scheduleEmailId,
          GROUP_CONCAT(userId) as userIds
        FROM ScheduleEmailRecipients 
        GROUP BY scheduleEmailId
      `,
        { type: Sequelize.QueryTypes.SELECT }
      );

      console.log(
        `Found ${junctionData.length} schedule emails to migrate back`
      );

      for (const data of junctionData) {
        // Convert comma-separated string to array
        const userIds = data.userIds ? data.userIds.split(',') : [];

        if (userIds.length > 0) {
          await queryInterface.sequelize.query(
            `
            UPDATE ScheduleEmails 
            SET recipientIds = :userIds 
            WHERE id = :scheduleId
          `,
            {
              replacements: {
                userIds: JSON.stringify(userIds),
                scheduleId: data.scheduleEmailId,
              },
            }
          );
        }
      }

      console.log('Successfully rolled back migration');
    } catch (error) {
      console.warn(
        'Rollback encountered issues (this might be expected):',
        error.message
      );
    }
  },
};
