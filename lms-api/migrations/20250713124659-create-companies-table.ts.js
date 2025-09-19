import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface) {
    await queryInterface.createTable('Companies', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      vatNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex('Companies', ['name'], {
      name: 'idx_company_name',
    });
    await queryInterface.addIndex('Companies', ['vatNumber'], {
      name: 'idx_company_vat_number',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Companies');
  },
};
