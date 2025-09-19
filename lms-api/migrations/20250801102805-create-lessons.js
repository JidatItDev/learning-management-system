'use-strict';

module.exports = {

  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Lessons', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
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
      videoUrl: {
        type: Sequelize.STRING(2083),
        allowNull: true,
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
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    // Add indexes
    await queryInterface.addIndex('Lessons', ['title'], {
      name: 'idx_lessons_title',
    });

    await queryInterface.addIndex('Lessons', ['courseId'], {
      name: 'idx_lessons_course_id',
    });

    await queryInterface.addIndex('Lessons', ['createdBy'], {
      name: 'idx_lessons_created_by',
    });

    await queryInterface.addIndex('Lessons', ['createdAt'], {
      name: 'idx_lessons_created_at',
    });

    await queryInterface.addIndex('Lessons', ['courseId', 'createdAt'], {
      name: 'idx_lessons_course_created_at',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Lessons');
  },
};
