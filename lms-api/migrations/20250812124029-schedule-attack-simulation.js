// 2. Fix ScheduleAttackSimulations Migration - Replace JSONB with JSON
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ScheduleAttackSimulations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      groupId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Groups',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userIds: {
        type: Sequelize.JSON, // Changed from JSONB to JSON for MySQL
        allowNull: true,
      },
      bundleId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Bundles',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      launchDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      launchTime: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('draft', 'scheduled', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      launchStatus: {
        type: Sequelize.ENUM('pending', 'in_progress', 'success', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      timezone: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      indexes: [
        { fields: ['groupId'], name: 'idx_schedule_simulations_group_id' },
        { fields: ['bundleId'], name: 'idx_schedule_simulations_bundle_id' },
        { fields: ['createdBy'], name: 'idx_schedule_simulations_created_by' },
        { fields: ['status'], name: 'idx_schedule_simulations_status' },
        { fields: ['launchStatus'], name: 'idx_schedule_simulations_launch_status' },
        { fields: ['launchDate'], name: 'idx_schedule_simulations_launch_date' },
      ],
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ScheduleAttackSimulations');
  },
};