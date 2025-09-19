'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.createTable('BundleCourses', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bundleId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Bundles',
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

  // Add indexes
  await queryInterface.addIndex('BundleCourses', ['bundleId', 'courseId'], {
    unique: true,
    name: 'unique_bundle_course',
  });
  
  await queryInterface.addIndex('BundleCourses', ['bundleId'], {
    name: 'idx_bundle_courses_bundle_id',
  });
  
  await queryInterface.addIndex('BundleCourses', ['courseId'], {
    name: 'idx_bundle_courses_course_id',
  });
  
  await queryInterface.addIndex('BundleCourses', ['createdAt'], {
    name: 'idx_bundle_courses_created_at',
  });
  },

  async down (queryInterface, Sequelize) {
await queryInterface.dropTable('BundleCourses');
  }
}; 
