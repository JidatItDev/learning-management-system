import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

class ScheduleEmailRecipient extends Model {
  declare id: string;
  declare scheduleEmailId: string;
  declare userId: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    ScheduleEmailRecipient.belongsTo(models.ScheduleEmail, {
      foreignKey: 'scheduleEmailId',
      as: 'scheduleEmail',
      onDelete: 'CASCADE',
    });

    ScheduleEmailRecipient.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
    });
  }
}

ScheduleEmailRecipient.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    scheduleEmailId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ScheduleEmails',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'ScheduleEmailRecipient',
    tableName: 'ScheduleEmailRecipients',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['scheduleEmailId', 'userId'],
        name: 'idx_schedule_email_recipients_unique',
        unique: true,
      },
      {
        fields: ['scheduleEmailId'],
        name: 'idx_schedule_email_recipients_schedule_id',
      },
      { fields: ['userId'], name: 'idx_schedule_email_recipients_user_id' },
    ],
  }
);

export default ScheduleEmailRecipient;
