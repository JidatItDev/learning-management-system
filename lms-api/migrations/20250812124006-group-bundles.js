module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GroupBundles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      groupId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Groups',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      bundlePurchaseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'BundlePurchases',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      seatsAllocated: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
        { fields: ['groupId'], name: 'idx_group_bundles_group_id' },
        { fields: ['bundlePurchaseId'], name: 'idx_group_bundles_bundle_purchase_id' },
      ],
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('GroupBundles');
  },
};