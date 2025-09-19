'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'invitationStatus', {
      type: Sequelize.ENUM('none', 'pending', 'sent', 'accepted', 'expired'),
      allowNull: false,
      defaultValue: 'none',
    });
    await queryInterface.addColumn('Users', 'invitationSentAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'invitationAcceptedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'microsoftUserId', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
    });

    // Add indexes
    await queryInterface.addIndex('Users', ['invitationStatus'], {
      name: 'idx_users_invitation_status',
    });
    await queryInterface.addIndex('Users', ['microsoftUserId'], {
      name: 'idx_users_microsoft_user_id',
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'invitationStatus');
    await queryInterface.removeColumn('Users', 'invitationSentAt');
    await queryInterface.removeColumn('Users', 'invitationAcceptedAt');
    await queryInterface.removeColumn('Users', 'microsoftUserId');
    await queryInterface.removeIndex('Users', 'idx_users_invitation_status');
    await queryInterface.removeIndex('Users', 'idx_users_microsoft_user_id');

    // Drop the ENUM type (MySQL-specific)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_Users_invitationStatus;');
  },
};