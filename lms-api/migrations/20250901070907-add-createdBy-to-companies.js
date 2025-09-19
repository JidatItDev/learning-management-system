// migrations/20230901-add-createdBy-to-companies.ts
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface) {
    await queryInterface.addColumn('Companies', 'createdBy', {
      type: DataTypes.UUID,
      allowNull: false,
    });

    await queryInterface.addIndex('Companies', ['createdBy'], {
      name: 'idx_companies_created_by',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('Companies', 'idx_companies_created_by');
    await queryInterface.removeColumn('Companies', 'createdBy');
  },
};
