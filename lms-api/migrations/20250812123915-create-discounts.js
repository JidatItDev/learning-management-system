// 1. Fix Discounts Migration - Replace JSONB with JSON for MySQL
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Discounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      bundleIds: {
        type: Sequelize.JSON, // Changed from JSONB to JSON for MySQL
        allowNull: true,
      },
      percentage: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      seats: {
        type: Sequelize.JSON, // Changed from JSONB to JSON for MySQL
        allowNull: true,
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    }, {
      indexes: [
        { fields: ['percentage'], name: 'idx_discounts_percentage' },
        { fields: ['expiryDate'], name: 'idx_discounts_expiry_date' },
      ],
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Discounts');
  },
};