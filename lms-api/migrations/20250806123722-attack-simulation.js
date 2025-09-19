'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AttackSimulations', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      courseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Courses',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      template: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING(2048),
        allowNull: false,
      },
      page: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      smtp: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Add indexes
    await queryInterface.addIndex('AttackSimulations', ['courseId'], {
      name: 'idx_attack_simulations_course_id',
    });

    await queryInterface.addIndex('AttackSimulations', ['createdBy'], {
      name: 'idx_attack_simulations_created_by',
    });

    await queryInterface.addIndex('AttackSimulations', ['name'], {
      name: 'idx_attack_simulations_name',
    });

    await queryInterface.addIndex('AttackSimulations', ['createdAt'], {
      name: 'idx_attack_simulations_created_at',
    });

    await queryInterface.addIndex('AttackSimulations', ['courseId', 'name'], {
      name: 'idx_attack_simulations_course_name',
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AttackSimulations');
  },
};