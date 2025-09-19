import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface) {
    await queryInterface.createTable('OTPs', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      otp: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
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

    await queryInterface.addIndex('OTPs', ['userId'], {
      name: 'idx_otp_user_id',
    });
    await queryInterface.addIndex('OTPs', ['otp'], { name: 'idx_otp_code' });
    await queryInterface.addIndex('OTPs', ['expiresAt'], {
      name: 'idx_otp_expires_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('OTPs');
  },
};
