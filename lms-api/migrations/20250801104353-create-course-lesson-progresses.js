'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
await queryInterface.createTable('CourseLessonProgress', {
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
    lessonId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Lessons',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    isCompleted: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completedAt: {
      type: Sequelize.DATE,
      allowNull: true,
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
  await queryInterface.addIndex('CourseLessonProgress', ['userId', 'lessonId'], {
    unique: true,
    name: 'idx_course_lesson_progress_composite',
  });
  
  await queryInterface.addIndex('CourseLessonProgress', ['isCompleted'], {
    name: 'idx_course_lesson_progress_is_completed',
  });
  
  await queryInterface.addIndex('CourseLessonProgress', ['userId'], {
    name: 'idx_course_lesson_progress_user_id',
  });
  
  await queryInterface.addIndex('CourseLessonProgress', ['lessonId'], {
    name: 'idx_course_lesson_progress_lesson_id',
  });
  
  await queryInterface.addIndex('CourseLessonProgress', ['completedAt'], {
    name: 'idx_course_lesson_progress_completed_at',
  });
  },

  async down (queryInterface, Sequelize) {
   await queryInterface.dropTable('CourseLessonProgress');
  }
};
