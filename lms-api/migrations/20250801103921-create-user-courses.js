'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('UserCourses', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

    await queryInterface.addIndex('UserCourses', ['userId', 'courseId'], {
    unique: true,
    name: 'idx_user_courses_composite',
  });

  await queryInterface.addIndex('UserCourses', ['courseId'], {
    name: 'idx_user_courses_course_id',
  });

    await queryInterface.addIndex('UserCourses', ['userId'], {
    name: 'idx_user_courses_user_id',
  });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('UserCourses');
  }
};
