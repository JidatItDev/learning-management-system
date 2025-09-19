'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Step 1: Truncate BundlePurchases to avoid foreign key constraints
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
      await queryInterface.sequelize.query('TRUNCATE TABLE BundlePurchases', { transaction });

      // Step 2: Truncate Discounts table to clear dummy data
      await queryInterface.sequelize.query('TRUNCATE TABLE Discounts', { transaction });
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });

      // Step 3: Change bundleIds to UUID
      await queryInterface.changeColumn(
        'Discounts',
        'bundleIds',
        {
          type: Sequelize.UUID,
          allowNull: true,
        },
        { transaction }
      );

      // Step 4: Rename bundleIds to bundleId
      await queryInterface.renameColumn('Discounts', 'bundleIds', 'bundleId', { transaction });

      // Step 5: Add isActive column
      await queryInterface.addColumn(
        'Discounts',
        'isActive',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        { transaction }
      );

      // Step 6: Add indexes for bundleId and isActive
      await queryInterface.addIndex(
        'Discounts',
        ['bundleId'],
        { name: 'idx_discounts_bundle_id', transaction }
      );
      await queryInterface.addIndex(
        'Discounts',
        ['isActive'],
        { name: 'idx_discounts_is_active', transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Step 1: Remove indexes
      await queryInterface.removeIndex('Discounts', 'idx_discounts_bundle_id', { transaction });
      await queryInterface.removeIndex('Discounts', 'idx_discounts_is_active', { transaction });

      // Step 2: Remove isActive column
      await queryInterface.removeColumn('Discounts', 'isActive', { transaction });

      // Step 3: Rename bundleId to bundleIds
      await queryInterface.renameColumn('Discounts', 'bundleId', 'bundleIds', { transaction });

      // Step 4: Change bundleIds back to JSON
      await queryInterface.changeColumn(
        'Discounts',
        'bundleIds',
        {
          type: Sequelize.JSON,
          allowNull: true,
        },
        { transaction }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};