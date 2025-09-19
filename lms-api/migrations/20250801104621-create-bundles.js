'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
await queryInterface.createTable('Bundles', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    bundleType: {
      type: Sequelize.ENUM(
        'Simulated Phishing & Security Awareness Training',
        'Advance Training'
      ),
      allowNull: false,
    },
    seatPrice: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
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
  await queryInterface.addIndex('Bundles', ['title'], {
    name: 'idx_bundles_title',
  });
  
  await queryInterface.addIndex('Bundles', ['bundleType'], {
    name: 'idx_bundles_type',
  });
  
  await queryInterface.addIndex('Bundles', ['seatPrice'], {
    name: 'idx_bundles_price',
  });
  
  await queryInterface.addIndex('Bundles', ['createdAt'], {
    name: 'idx_bundles_created_at',
  });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Bundles');
  }
};
