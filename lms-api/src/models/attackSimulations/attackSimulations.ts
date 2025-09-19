import { DataTypes, Model, Transaction } from 'sequelize';
import sequelize from "../../config/database";
import { ICourse, IUser } from '../../types/models';
import { AppError } from '../../middleware/errorHandler';

class AttackSimulation extends Model {
  declare id: string;
  declare courseId: string;
  declare name: string;
  declare template: string;
  declare url: string;
  declare page: string;
  declare smtp: string;
  declare createdBy: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Association methods for Course
  declare getCourse: () => Promise<ICourse>;
  declare setCourse: (course: ICourse) => Promise<void>;

  // Association methods for Creator (User)
  declare getCreatedByUser: () => Promise<IUser>;
  declare setCreatedByUser: (user: IUser) => Promise<void>;

  static associate(models: any) {
    // AttackSimulation belongs to Course
    AttackSimulation.belongsTo(models.Course, {
      foreignKey: 'courseId',
      as: 'course',
      onDelete: 'CASCADE', // Delete attack simulation when course is deleted
      onUpdate: 'CASCADE',
    });

    // AttackSimulation belongs to User (creator)
    AttackSimulation.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'createdByUser',
      onDelete: 'RESTRICT', // Prevent deletion of user if they have created attack simulations
      onUpdate: 'CASCADE',
    });
  }
}

AttackSimulation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Courses',
        key: 'id',
      },
      validate: {
        notEmpty: true,
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    template: {
      type: DataTypes.STRING(2000),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    url: {
      type: DataTypes.STRING(2048), // URLs can be long, so increased length
      allowNull: false,
      validate: {
        isUrl: {
          msg: 'Must be a valid URL',
        },
        notEmpty: true,
      },
    },
    page: {
      type: DataTypes.TEXT, // Changed to TEXT for longer page content
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    smtp: {
      type: DataTypes.STRING(500), // Increased length for SMTP configuration
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    sequelize,
    modelName: 'AttackSimulation',
    tableName: 'AttackSimulations',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['courseId'],
        name: 'idx_attack_simulations_course_id',
      },
      {
        fields: ['createdBy'],
        name: 'idx_attack_simulations_created_by',
      },
      {
        fields: ['name'],
        name: 'idx_attack_simulations_name',
      },
      {
        fields: ['createdAt'],
        name: 'idx_attack_simulations_created_at',
      },
      {
        fields: ['courseId', 'name'],
        name: 'idx_attack_simulations_course_name',
        unique: true, // Ensure unique simulation names per course
      },
    ],
    hooks: {
      beforeValidate: (attackSimulation: AttackSimulation) => {
        // Trim whitespace from string fields
        if (attackSimulation.name) {
          attackSimulation.name = attackSimulation.name.trim();
        }
        if (attackSimulation.url) {
          attackSimulation.url = attackSimulation.url.trim();
        }
        if (attackSimulation.smtp) {
          attackSimulation.smtp = attackSimulation.smtp.trim();
        }
      },
      beforeCreate: async (attackSimulation: AttackSimulation, options: { transaction?: Transaction }) => {
        // Validate that the referenced course exists
        const course = await sequelize.models.Course.findByPk(
          attackSimulation.courseId,
          { transaction: options.transaction }
        );
        if (!course) {
          throw new AppError('Referenced course not found', 404);
        }

        // Validate that the creator user exists
        const user = await sequelize.models.User.findByPk(
          attackSimulation.createdBy,
          { transaction: options.transaction }
        );
        if (!user) {
          throw new AppError('Creator user not found', 404);
        }
      },
      beforeUpdate: async (attackSimulation: AttackSimulation, options: { transaction?: Transaction }) => {
        // Only validate if courseId or createdBy are being updated
        if (attackSimulation.changed('courseId')) {
          const course = await sequelize.models.Course.findByPk(
            attackSimulation.courseId,
            { transaction: options.transaction }
          );
          if (!course) {
            throw new AppError('Referenced course not found', 404);
          }
        }

        if (attackSimulation.changed('createdBy')) {
          const user = await sequelize.models.User.findByPk(
            attackSimulation.createdBy,
            { transaction: options.transaction }
          );
          if (!user) {
            throw new AppError('Creator user not found', 404);
          }
        }
      },
    },
  }
);

export default AttackSimulation;