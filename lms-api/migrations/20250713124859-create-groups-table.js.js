import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface) {
    await queryInterface.createTable('Groups', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Companies',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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

    await queryInterface.addIndex('Groups', ['name', 'companyId'], {
      name: 'idx_group_name_company',
      unique: true,
    });
    await queryInterface.addIndex('Groups', ['companyId'], {
      name: 'idx_group_company_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Groups');
  },
};
