'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the category column
    await queryInterface.addColumn('Bundles', 'category', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: 'General', // Provide a default for existing records
    });

    // Add index for the new category column
    await queryInterface.addIndex('Bundles', ['category'], {
      name: 'idx_bundles_category',
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the index first
    await queryInterface.removeIndex('Bundles', 'idx_bundles_category');
    
    // Remove the column
    await queryInterface.removeColumn('Bundles', 'category');
  }
};