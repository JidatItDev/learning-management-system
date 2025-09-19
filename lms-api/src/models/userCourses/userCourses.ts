import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { IUser, ICourse, IAttackSimulationSchedule } from '../../types/models';
import { UserRole } from '../../middleware/authenticator';

// Align with Schedule Attack Simulation statuses
export enum CourseStatus {
  PENDING = 'pending', // Course is scheduled but not yet started
  ACTIVE = 'active', // Course is currently available to user
  COMPLETED = 'completed', // Course period has ended
  EXPIRED = 'expired', // Course has expired and attack simulation may be triggered
}

class UserCourse extends Model {
  declare id: string;
  declare userId: string;
  declare courseId: string;
  declare scheduleAttackSimulationId: string | null;
  declare launchDate: Date | null;
  declare expiryDate: Date | null;
  declare status: CourseStatus;
  declare visibility: boolean; // Controls whether user can see the course
  declare attackSimulationId: string | null; // Reference to launched attack simulation
  declare createdAt: Date;
  declare updatedAt: Date;

  declare getUser: () => Promise<IUser>;
  declare setUser: (user: IUser) => Promise<void>;
  declare getCourse: () => Promise<ICourse>;
  declare setCourse: (course: ICourse) => Promise<void>;
  declare getScheduleAttackSimulation: () => Promise<IAttackSimulationSchedule>;
  declare setScheduleAttackSimulation: (
    schedule: IAttackSimulationSchedule
  ) => Promise<void>;

  // Instance methods for course lifecycle
  isVisibleToUser(userRole: UserRole): boolean {
    // Admin and Contributors can always see all courses
    if (userRole === UserRole.ADMIN || userRole === UserRole.CONTRIBUTOR) {
      return true;
    }

    // Group Leaders and Subscribers only see courses based on visibility flag
    if (
      userRole === UserRole.GROUP_LEADER ||
      userRole === UserRole.SUBSCRIBER
    ) {
      return this.visibility && this.status === CourseStatus.ACTIVE;
    }

    return false;
  }

  isCurrentlyActive(): boolean {
    const now = new Date();
    if (!this.launchDate || !this.expiryDate) {
      return false;
    }
    return (
      now >= this.launchDate &&
      now <= this.expiryDate &&
      this.status === CourseStatus.ACTIVE
    );
  }

  hasExpired(): boolean {
    const now = new Date();
    return this.expiryDate ? now > this.expiryDate : false;
  }

  shouldTriggerAttackSimulation(): boolean {
    if (!this.expiryDate || this.attackSimulationId) return false;

    const now = new Date();
    const attackSimulationDate = new Date(this.expiryDate);
    attackSimulationDate.setDate(attackSimulationDate.getDate() + 1); // Next day after expiry

    return now >= attackSimulationDate && this.status === CourseStatus.EXPIRED;
  }

  canActivate(): boolean {
    const now = new Date();
    return (
      this.launchDate !== null &&
      now >= this.launchDate &&
      this.status === CourseStatus.PENDING
    );
  }

  shouldExpire(): boolean {
    const now = new Date();
    return (
      this.expiryDate !== null &&
      now > this.expiryDate &&
      this.status === CourseStatus.ACTIVE
    );
  }

  static associate(models: any) {
    UserCourse.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    UserCourse.belongsTo(models.Course, {
      foreignKey: 'courseId',
      as: 'course',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    UserCourse.belongsTo(models.ScheduleAttackSimulation, {
      foreignKey: 'scheduleAttackSimulationId',
      as: 'scheduleAttackSimulation',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Reference to attack simulation (from Course's attackSimulations)
    UserCourse.belongsTo(models.AttackSimulation, {
      foreignKey: 'attackSimulationId',
      as: 'attackSimulation',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  }
}

UserCourse.init(
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
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Courses',
        key: 'id',
      },
    },
    scheduleAttackSimulationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'ScheduleAttackSimulations',
        key: 'id',
      },
    },
    launchDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CourseStatus)),
      allowNull: false,
      defaultValue: CourseStatus.PENDING,
    },
    visibility: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Controls whether the course is visible to the user',
    },
    attackSimulationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'AttackSimulations',
        key: 'id',
      },
      comment: 'Reference to the attack simulation launched for this course',
    },
  },
  {
    sequelize,
    modelName: 'UserCourse',
    tableName: 'UserCourses',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['userId', 'courseId', 'scheduleAttackSimulationId'],
        name: 'idx_user_courses_composite',
      },
      {
        fields: ['courseId'],
        name: 'idx_user_courses_course_id',
      },
      {
        fields: ['userId'],
        name: 'idx_user_courses_user_id',
      },
      {
        fields: ['scheduleAttackSimulationId'],
        name: 'idx_user_courses_schedule_id',
      },
      {
        fields: ['launchDate'],
        name: 'idx_user_courses_launch_date',
      },
      {
        fields: ['expiryDate'],
        name: 'idx_user_courses_expiry_date',
      },
      {
        fields: ['status'],
        name: 'idx_user_courses_status',
      },
      {
        fields: ['visibility'],
        name: 'idx_user_courses_visibility',
      },
      {
        fields: ['attackSimulationId'],
        name: 'idx_user_courses_attack_simulation_id',
      },
    ],
  }
);

export default UserCourse;
