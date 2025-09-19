'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if columns exist before adding them
    const tableDescription = await queryInterface.describeTable('Groups');
    
    // Step 1: Add new columns only if they don't exist
    if (!tableDescription.gophishGroupID) {
      await queryInterface.addColumn('Groups', 'gophishGroupID', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!tableDescription.signInType) {
      await queryInterface.addColumn('Groups', 'signInType', {
        type: Sequelize.ENUM('withPassword', 'passwordless', 'microsoftEntraID'),
        allowNull: false,
        defaultValue: 'withPassword',
      });
    }

    // Step 2: Remove old indexes (with error handling)
    try {
      await queryInterface.removeIndex('Groups', 'idx_group_name_company');
    } catch (error) {
      console.log('idx_group_name_company might not exist, skipping...');
    }

    try {
      await queryInterface.removeIndex('Groups', 'idx_group_company_id');
    } catch (error) {
      console.log('idx_group_company_id might not exist, skipping...');
    }

    // Step 3: Add new indexes (with error handling)
    const indexesToAdd = [
      { fields: ['companyId'], name: 'idx_groups_company_id' },
      { fields: ['name'], name: 'idx_groups_name' },
      { fields: ['companyId', 'name'], name: 'idx_groups_company_name', unique: true },
      { fields: ['isActive'], name: 'idx_groups_is_active' },
      { fields: ['signInType'], name: 'idx_groups_sign_in_type' },
    ];

    for (const index of indexesToAdd) {
      try {
        await queryInterface.addIndex('Groups', index.fields, {
          name: index.name,
          unique: index.unique || false,
        });
      } catch (error) {
        console.log(`Index ${index.name} might already exist, skipping...`);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Step 1: Remove new indexes
    const indexesToRemove = [
      'idx_groups_company_id',
      'idx_groups_name',
      'idx_groups_company_name',
      'idx_groups_is_active',
      'idx_groups_sign_in_type'
    ];

    for (const indexName of indexesToRemove) {
      try {
        await queryInterface.removeIndex('Groups', indexName);
      } catch (error) {
        console.log(`Could not remove index ${indexName}, might not exist`);
      }
    }

    // Step 2: Re-add old indexes
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

    // Step 3: Remove new columns
    try {
      await queryInterface.removeColumn('Groups', 'gophishGroupID');
    } catch (error) {
      console.log('Could not remove gophishGroupID column');
    }
    
    try {
      await queryInterface.removeColumn('Groups', 'signInType');
    } catch (error) {
      console.log('Could not remove signInType column');
    }

    // Step 4: Drop ENUM type (if required by the database)
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Groups_signInType";');
    } catch (error) {
      console.log('Could not drop ENUM type');
    }
  },
};