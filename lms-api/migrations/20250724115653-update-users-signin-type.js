'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Users', 'signInType', {
      type: Sequelize.ENUM('withPassword', 'passwordless', 'microsoftEntraID'),
      allowNull: false,
      defaultValue: 'withPassword',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Users', 'signInType', {
      type: Sequelize.ENUM('withPassword', 'passwordless'),
      allowNull: false,
      defaultValue: 'withPassword',
    });
  },
};