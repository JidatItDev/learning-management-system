import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { ILesson, IUser, IBundle, IAttackSimulation } from '../../types/models';

class Course extends Model {
  declare id: string;
  declare title: string;
  declare description: string;
  declare createdBy: string;
  declare createdAt: Date;
  declare updatedAt: Date;
 
  // Association methods
  declare getCreator: () => Promise<IUser>;
  declare setCreator: (user: IUser) => Promise<void>;

  declare getLessons: () => Promise<ILesson[]>;
  declare addLesson: (lesson: ILesson) => Promise<void>;
  declare removeLesson: (lesson: ILesson) => Promise<void>;
  declare hasLesson: (lesson: ILesson) => Promise<boolean>;
  declare countLessons: () => Promise<number>;
  declare createLesson: (lessonData: any) => Promise<ILesson>;

  declare getEnrolledUsers: () => Promise<IUser[]>;
  declare addEnrolledUser: (user: IUser) => Promise<void>;
  declare removeEnrolledUser: (user: IUser) => Promise<void>;
  declare hasEnrolledUser: (user: IUser) => Promise<boolean>;
  declare countEnrolledUsers: () => Promise<number>;

  // Bundle association methods (many-to-many)
  declare getBundles: () => Promise<IBundle[]>;
  declare addBundle: (bundle: IBundle) => Promise<void>;
  declare removeBundle: (bundle: IBundle) => Promise<void>;
  declare hasBundle: (bundle: IBundle) => Promise<boolean>;
  declare countBundles: () => Promise<number>;

  // AttackSimulation association methods (one-to-many)
  declare getAttackSimulations: () => Promise<IAttackSimulation[]>;
  declare addAttackSimulation: (attackSimulation: IAttackSimulation) => Promise<void>;
  declare removeAttackSimulation: (attackSimulation: IAttackSimulation) => Promise<void>;
  declare hasAttackSimulation: (attackSimulation: IAttackSimulation) => Promise<boolean>;
  declare countAttackSimulations: () => Promise<number>;
  declare createAttackSimulation: (attackSimulationData: any) => Promise<IAttackSimulation>;

  static associate(models: any) {
    // Course belongs to User (creator)
    Course.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
      onDelete: 'RESTRICT', // Prevent deletion of user if they have created courses
      onUpdate: 'CASCADE',
    });

    // Course has many lessons
    Course.hasMany(models.Lesson, {
      foreignKey: 'courseId',
      as: 'lessons',
      onDelete: 'CASCADE', // Delete lessons when course is deleted
      onUpdate: 'CASCADE',
    });

    // Course has many attack simulations
    Course.hasMany(models.AttackSimulation, {
      foreignKey: 'courseId',
      as: 'attackSimulations',
      onDelete: 'CASCADE', // Delete attack simulations when course is deleted
      onUpdate: 'CASCADE',
    });

    // Course belongs to many users through enrollment
    Course.belongsToMany(models.User, {
      through: models.UserCourse,
      foreignKey: 'courseId',
      otherKey: 'userId',
      as: 'enrolledUsers',
    });

    // Course belongs to many bundles through BundleCourse junction table
    Course.belongsToMany(models.Bundle, {
      through: models.BundleCourse,
      foreignKey: 'courseId',
      otherKey: 'bundleId',
      as: 'bundles',
    });
  }
}

Course.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    modelName: 'Course',
    tableName: 'Courses',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['title'],
        name: 'idx_courses_title',
      },
      {
        fields: ['createdBy'],
        name: 'idx_courses_created_by',
      },
      {
        fields: ['createdAt'],
        name: 'idx_courses_created_at',
      },
    ],
    hooks: {
      beforeValidate: (course: Course) => {
        if (course.title) {
          course.title = course.title.trim();
        }
      },
    },
  }
);

export default Course;