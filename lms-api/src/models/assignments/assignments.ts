import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { ILesson } from '../../types/models';

class Assignment extends Model {
  declare id: string;
  declare lessonId: string;
  declare title: string;
  declare description?: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Association methods
  declare getLesson: () => Promise<ILesson>;
  declare setLesson: (lesson: ILesson) => Promise<void>;

  static associate(models: any) {
    Assignment.belongsTo(models.Lesson, {
      foreignKey: 'lessonId',
      as: 'lesson',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
}

Assignment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lessonId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Lessons',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Assignment',
    tableName: 'Assignments',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['lessonId'],
        name: 'idx_assignments_lesson_id',
      },
      {
        fields: ['title'],
        name: 'idx_assignments_title',
      },
    ],
    hooks: {
      beforeValidate: (assignment: Assignment) => {
        if (assignment.title) {
          assignment.title = assignment.title.trim();
        }
      },
    },
  }
);

export default Assignment;