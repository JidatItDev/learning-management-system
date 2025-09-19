module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BundlePurchases', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      bundleId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Bundles',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      discountId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Discounts',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      seatsPurchased: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      totalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      purchasedBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'RESTRICT', // Changed from 'SET NULL' to match model
        onUpdate: 'CASCADE',
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
        { fields: ['bundleId'], name: 'idx_bundle_purchases_bundle_id' },
        { fields: ['discountId'], name: 'idx_bundle_purchases_discount_id' },
        { fields: ['purchasedBy'], name: 'idx_bundle_purchases_purchased_by' },
        { fields: ['createdAt'], name: 'idx_bundle_purchases_created_at' }, // Added missing index
      ],
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('BundlePurchases');
  },
};