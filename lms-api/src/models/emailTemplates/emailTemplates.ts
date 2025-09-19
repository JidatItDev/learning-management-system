import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

class EmailTemplate extends Model {
  declare id: string;
  declare name: string;
  declare type: string;
  declare subject: string;
  declare body: string;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;

  static async getTemplateByName(name: string): Promise<EmailTemplate> {
    const template = await EmailTemplate.findOne({ where: { name } });
    if (!template) {
      throw new AppError('Email template not found', 404);
    }
    return template;
  }

  static associate(models: any) {
    EmailTemplate.hasMany(models.ScheduleEmail, {
      foreignKey: 'templateId',
      as: 'scheduledEmails',
      onDelete: 'CASCADE',
    });
  }
}

EmailTemplate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,    
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'EmailTemplate',
    tableName: 'EmailTemplates',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [{ fields: ['name'], name: 'idx_email_templates_name' }],
  }
);

export default EmailTemplate;
