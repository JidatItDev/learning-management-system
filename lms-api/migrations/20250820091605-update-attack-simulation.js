'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change column type from JSON to STRING
    await queryInterface.changeColumn('AttackSimulations', 'template', {
      type: Sequelize.STRING(2000), // Adjust length as needed
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert column type back to JSON
    await queryInterface.changeColumn('AttackSimulations', 'template', {
      type: Sequelize.JSON,
      allowNull: false,
    });
  },
};
