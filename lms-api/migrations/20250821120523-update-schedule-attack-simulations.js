// Migration: Update ScheduleAttackSimulations table structure
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add new columns
    await queryInterface.addColumn('ScheduleAttackSimulations', 'name', {
      type: Sequelize.STRING(255),
      allowNull: false,
      after: 'id' // MySQL specific - places column after id
    });

    await queryInterface.addColumn('ScheduleAttackSimulations', 'groupIds', {
      type: Sequelize.JSON,
      allowNull: false,
      after: 'name'
    });

    await queryInterface.addColumn('ScheduleAttackSimulations', 'campaignType', {
      type: Sequelize.ENUM('Simulated Phishing & Security Awareness Training', 'Advance Training'),
      allowNull: false,
      after: 'bundleId'
    });

    // 2. Modify existing columns
    // Update launchStatus ENUM values
    await queryInterface.changeColumn('ScheduleAttackSimulations', 'launchStatus', {
      type: Sequelize.ENUM('Deliver Immediately', 'Schedule Later'),
      allowNull: false,
      defaultValue: 'Schedule Later'
    });

    // 3. Migrate data from groupId to groupIds (if there's existing data)
    // This assumes you want to convert single groupId to array format
    await queryInterface.sequelize.query(`
      UPDATE ScheduleAttackSimulations 
      SET groupIds = JSON_ARRAY(groupId) 
      WHERE groupId IS NOT NULL
    `);

    // 4. Remove the old groupId column
    await queryInterface.removeColumn('ScheduleAttackSimulations', 'groupId');

    // 5. Add new indexes
    await queryInterface.addIndex('ScheduleAttackSimulations', ['campaignType'], {
      name: 'idx_schedule_simulations_campaign_type'
    });

    // Remove old index for groupId (if it exists)
    try {
      await queryInterface.removeIndex('ScheduleAttackSimulations', 'idx_schedule_simulations_group_id');
    } catch (error) {
      console.log('Index idx_schedule_simulations_group_id does not exist, skipping removal');
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverse the migration
    
    // 1. Add back groupId column
    await queryInterface.addColumn('ScheduleAttackSimulations', 'groupId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Groups',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      after: 'id'
    });

    // 2. Migrate data back from groupIds to groupId (take first element)
    await queryInterface.sequelize.query(`
      UPDATE ScheduleAttackSimulations 
      SET groupId = JSON_UNQUOTE(JSON_EXTRACT(groupIds, '$[0]'))
      WHERE groupIds IS NOT NULL 
      AND JSON_LENGTH(groupIds) > 0
    `);

    // 3. Remove new columns
    await queryInterface.removeColumn('ScheduleAttackSimulations', 'name');
    await queryInterface.removeColumn('ScheduleAttackSimulations', 'groupIds');
    await queryInterface.removeColumn('ScheduleAttackSimulations', 'campaignType');

    // 4. Revert launchStatus ENUM
    await queryInterface.changeColumn('ScheduleAttackSimulations', 'launchStatus', {
      type: Sequelize.ENUM('pending', 'in_progress', 'success', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    });

    // 5. Restore old indexes
    await queryInterface.addIndex('ScheduleAttackSimulations', ['groupId'], {
      name: 'idx_schedule_simulations_group_id'
    });

    // Remove new indexes
    try {
      await queryInterface.removeIndex('ScheduleAttackSimulations', 'idx_schedule_simulations_campaign_type');
    } catch (error) {
      console.log('Index idx_schedule_simulations_campaign_type does not exist, skipping removal');
    }
  },
};