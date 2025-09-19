'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the missing createdBy column
    await queryInterface.addColumn('Groups', 'createdBy', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Add the missing indexes (some might already exist, so we'll try-catch them)
    const indexesToAdd = [
      { fields: ['companyId'], name: 'idx_groups_company_id' },
      { fields: ['name'], name: 'idx_groups_name' },
      { fields: ['companyId', 'name'], name: 'idx_groups_company_name', unique: true },
      { fields: ['isActive'], name: 'idx_groups_is_active' },
      { fields: ['createdBy'], name: 'idx_groups_created_by' },
      { fields: ['signInType'], name: 'idx_groups_sign_in_type' },
    ];

    for (const index of indexesToAdd) {
      try {
        await queryInterface.addIndex('Groups', index.fields, {
          name: index.name,
          unique: index.unique || false,
        });
        console.log(`Added index: ${index.name}`);
      } catch (error) {
        console.log(`Index ${index.name} might already exist, skipping...`);
      }
    }

    // Remove old indexes if they exist
    const oldIndexesToRemove = ['idx_group_name_company', 'idx_group_company_id'];
    
    for (const indexName of oldIndexesToRemove) {
      try {
        await queryInterface.removeIndex('Groups', indexName);
        console.log(`Removed old index: ${indexName}`);
      } catch (error) {
        console.log(`Index ${indexName} might not exist, skipping...`);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove the createdBy column
    await queryInterface.removeColumn('Groups', 'createdBy');

    // Remove new indexes
    const indexesToRemove = [
      'idx_groups_company_id',
      'idx_groups_name', 
      'idx_groups_company_name',
      'idx_groups_is_active',
      'idx_groups_created_by',
      'idx_groups_sign_in_type'
    ];

    for (const indexName of indexesToRemove) {
      try {
        await queryInterface.removeIndex('Groups', indexName);
      } catch (error) {
        console.log(`Could not remove index ${indexName}, might not exist`);
      }
    }

    // Re-add old indexes
    try {
      await queryInterface.addIndex('Groups', ['name', 'companyId'], {
        name: 'idx_group_name_company',
        unique: true,
      });
      await queryInterface.addIndex('Groups', ['companyId'], {
        name: 'idx_group_company_id',
      });
    } catch (error) {
      console.log('Could not re-add old indexes');
    }
  },
};