import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { IUser, ILesson } from '../../types/models';

class CourseLessonProgress extends Model {
  declare id: string;
  declare userId: string;
  declare lessonId: string;
  declare isCompleted: boolean;
  declare completedAt?: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Association methods
  declare getUser: () => Promise<IUser>;
  declare setUser: (user: IUser) => Promise<void>;
  declare getLesson: () => Promise<ILesson>;
  declare setLesson: (lesson: ILesson) => Promise<void>;

  static associate(models: any) {
    CourseLessonProgress.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    CourseLessonProgress.belongsTo(models.Lesson, {
      foreignKey: 'lessonId',
      as: 'lesson',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
}

CourseLessonProgress.init(
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
    lessonId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Lessons',
        key: 'id',
      },
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isNotFuture(value: Date) {
          if (value && value > new Date()) {
            throw new Error('Completion date cannot be in the future');
          }
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'CourseLessonProgress',
    tableName: 'CourseLessonProgress',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['userId', 'lessonId'],
        name: 'idx_course_lesson_progress_composite',
        unique: true, // Ensure one progress record per user per lesson
      },
      {
        fields: ['isCompleted'],
        name: 'idx_course_lesson_progress_is_completed',
      },
      {
        fields: ['userId'],
        name: 'idx_course_lesson_progress_user_id',
      },
      {
        fields: ['lessonId'],
        name: 'idx_course_lesson_progress_lesson_id',
      },
      {
        fields: ['completedAt'],
        name: 'idx_course_lesson_progress_completed_at',
      },
    ],
    hooks: {
      beforeSave: (progress: CourseLessonProgress) => {
        // Automatically set completedAt when marking as completed
        if (progress.isCompleted && !progress.completedAt) {
          progress.completedAt = new Date();
        }
        // Clear completedAt when marking as not completed
        if (!progress.isCompleted) {
          progress.completedAt = null;
        }
      },
    },
  }
);

export default CourseLessonProgress;
