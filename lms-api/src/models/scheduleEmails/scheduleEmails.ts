import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { v4 as uuidv4 } from 'uuid';

export enum ScheduleStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

class ScheduleEmail extends Model {
  declare id: string;
  declare templateId: string;
  declare customSubject: string | null;
  declare status: ScheduleStatus;
  declare createdBy: string;
  declare scheduledAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Add these association property declarations
  declare template?: any;
  declare createdByUser?: any;
  declare recipientUsers?: any[];

  declare getTemplate: () => Promise<any>;
  declare getCreatedByUser: () => Promise<any>;
  declare getRecipientUsers: () => Promise<any[]>;
  declare addRecipientUser: (user: any) => Promise<void>;
  declare removeRecipientUser: (user: any) => Promise<void>;
  declare setRecipientUsers: (users: any[]) => Promise<void>;


  static associate(models: any) {
    // Association with EmailTemplate
    ScheduleEmail.belongsTo(models.EmailTemplate, {
      foreignKey: 'templateId',
      as: 'template',
    });

    // Association with User (creator)
    ScheduleEmail.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'createdByUser',
    });

    // Many-to-many association with User (recipients) through junction table
    ScheduleEmail.belongsToMany(models.User, {
      through: models.ScheduleEmailRecipient,
      foreignKey: 'scheduleEmailId',
      otherKey: 'userId',
      as: 'recipientUsers',
    });

    // Direct association with junction table for easier querying
    ScheduleEmail.hasMany(models.ScheduleEmailRecipient, {
      foreignKey: 'scheduleEmailId',
      as: 'recipients',
    });
  }
}

ScheduleEmail.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: () => uuidv4(),
      primaryKey: true,
    },
    templateId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'EmailTemplates',
        key: 'id',
      },
    },
    customSubject: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ScheduleStatus)),
      allowNull: false,
      defaultValue: ScheduleStatus.DRAFT,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'ScheduleEmail',
    tableName: 'ScheduleEmails',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { fields: ['templateId'], name: 'idx_schedule_emails_template_id' },
      { fields: ['createdBy'], name: 'idx_schedule_emails_created_by' },
      { fields: ['status'], name: 'idx_schedule_emails_status' },
      { fields: ['scheduledAt'], name: 'idx_schedule_emails_scheduled_at' },
      {
        fields: ['status', 'scheduledAt'],
        name: 'idx_schedule_emails_pending',
      },
    ],
  }
);

export default ScheduleEmail;
