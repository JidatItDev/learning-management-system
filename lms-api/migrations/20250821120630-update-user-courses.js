// Migration: Update UserCourses table structure
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add new columns
    await queryInterface.addColumn('UserCourses', 'scheduleAttackSimulationId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'ScheduleAttackSimulations',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      after: 'courseId' // MySQL specific - places column after courseId
    });

    await queryInterface.addColumn('UserCourses', 'launchDate', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'scheduleAttackSimulationId'
    });

    await queryInterface.addColumn('UserCourses', 'expiryDate', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'launchDate'
    });

    await queryInterface.addColumn('UserCourses', 'status', {
      type: Sequelize.ENUM('pending', 'active', 'completed', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
      after: 'expiryDate'
    });

    await queryInterface.addColumn('UserCourses', 'visibility', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Controls whether the course is visible to the user',
      after: 'status'
    });

    await queryInterface.addColumn('UserCourses', 'attackSimulationId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'AttackSimulations',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      comment: 'Reference to the attack simulation launched for this course',
      after: 'visibility'
    });

    // 2. Update existing composite index to include scheduleAttackSimulationId
    // First remove the old unique composite index
    await queryInterface.removeIndex('UserCourses', 'idx_user_courses_composite');

    // Add the new composite index (non-unique since we added scheduleAttackSimulationId)
    await queryInterface.addIndex('UserCourses', ['userId', 'courseId', 'scheduleAttackSimulationId'], {
      name: 'idx_user_courses_composite'
    });

    // 3. Add new indexes
    await queryInterface.addIndex('UserCourses', ['scheduleAttackSimulationId'], {
      name: 'idx_user_courses_schedule_id'
    });

    await queryInterface.addIndex('UserCourses', ['launchDate'], {
      name: 'idx_user_courses_launch_date'
    });

    await queryInterface.addIndex('UserCourses', ['expiryDate'], {
      name: 'idx_user_courses_expiry_date'
    });

    await queryInterface.addIndex('UserCourses', ['status'], {
      name: 'idx_user_courses_status'
    });

    await queryInterface.addIndex('UserCourses', ['visibility'], {
      name: 'idx_user_courses_visibility'
    });

    await queryInterface.addIndex('UserCourses', ['attackSimulationId'], {
      name: 'idx_user_courses_attack_simulation_id'
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverse the migration
    
    // 1. Remove new indexes
    const indexesToRemove = [
      'idx_user_courses_schedule_id',
      'idx_user_courses_launch_date',
      'idx_user_courses_expiry_date',
      'idx_user_courses_status',
      'idx_user_courses_visibility',
      'idx_user_courses_attack_simulation_id'
    ];

    for (const indexName of indexesToRemove) {
      try {
        await queryInterface.removeIndex('UserCourses', indexName);
      } catch (error) {
        console.log(`Index ${indexName} does not exist, skipping removal`);
      }
    }

    // 2. Restore original composite index
    try {
      await queryInterface.removeIndex('UserCourses', 'idx_user_courses_composite');
    } catch (error) {
      console.log('Composite index does not exist, skipping removal');
    }

    // Add back the original unique composite index
    await queryInterface.addIndex('UserCourses', ['userId', 'courseId'], {
      unique: true,
      name: 'idx_user_courses_composite'
    });

    // 3. Remove new columns
    const columnsToRemove = [
      'scheduleAttackSimulationId',
      'launchDate',
      'expiryDate',
      'status',
      'visibility',
      'attackSimulationId'
    ];

    for (const columnName of columnsToRemove) {
      try {
        await queryInterface.removeColumn('UserCourses', columnName);
      } catch (error) {
        console.log(`Column ${columnName} does not exist, skipping removal`);
      }
    }
  },
};