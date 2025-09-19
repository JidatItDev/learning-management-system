import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { IAssignment, ICourseLessonProgress } from '../../types/models';

class Lesson extends Model {
  declare id: string;
  declare title: string;
  declare description: string;
  declare courseId: string;
  declare videoUrl?: string;
  declare createdBy: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Association methods
  declare getAssignments: () => Promise<IAssignment[]>;
  declare addAssignment: (assignment: IAssignment) => Promise<void>;
  declare removeAssignment: (assignment: IAssignment) => Promise<void>;
  declare hasAssignment: (assignment: IAssignment) => Promise<boolean>;
  declare countAssignments: () => Promise<number>;
  declare createAssignment: (assignmentData: any) => Promise<IAssignment>;

  declare getProgress: () => Promise<ICourseLessonProgress[]>;
  declare createProgress: (progressData: any) => Promise<ICourseLessonProgress>;

  static associate(models: any) {
    Lesson.belongsTo(models.Course, {
      foreignKey: 'courseId',
      as: 'course',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Lesson.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    Lesson.hasMany(models.Assignment, {
      foreignKey: 'lessonId',
      as: 'assignments',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    Lesson.hasMany(models.CourseLessonProgress, {
      foreignKey: 'lessonId',
      as: 'progress',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
}

Lesson.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Courses',
        key: 'id',
      },
    },
    videoName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Lesson',
    tableName: 'Lessons',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['title'],
        name: 'idx_lessons_title',
      },
      {
        fields: ['courseId'],
        name: 'idx_lessons_course_id',
      },
      {
        fields: ['createdBy'],
        name: 'idx_lessons_created_by',
      },
      {
        fields: ['createdAt'],
        name: 'idx_lessons_created_at',
      },
      {
        fields: ['courseId', 'createdAt'],
        name: 'idx_lessons_course_created_at',
      },
    ],
    hooks: {
      beforeValidate: (lesson: Lesson) => {
        if (lesson.title) {
          lesson.title = lesson.title.trim();
        }
      },
    },
  }
);

export default Lesson;
