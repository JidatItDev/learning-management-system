import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { IOTP } from '../../types/models';

class OTP extends Model implements IOTP {
  declare id: string;
  declare userId: string;
  declare otp: string;
  declare expiresAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    OTP.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
}

OTP.init(
  {
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
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'OTP',
    tableName: 'OTPs',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { fields: ['userId'], name: 'idx_otp_user_id' },
      { fields: ['otp'], name: 'idx_otp_code' },
      { fields: ['expiresAt'], name: 'idx_otp_expires_at' },
    ],
  }
);

export default OTP;
