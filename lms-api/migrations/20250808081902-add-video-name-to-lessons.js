'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Lessons', 'videoName', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '', // Optional: Adjust based on existing data strategy
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Lessons', 'videoName');
  },
};
