import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import {
  IGroupUser,
  IOTP,
  ICourse,
  ICourseLessonProgress,
  IAttackSimulation,
} from '../../types/models';
import GroupUser from '../groupUsers/groupUsers';
import Group from '../groups/groups';
import { AppError } from '../../middleware/errorHandler';

class User extends Model {
  declare id: string;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare password: string | null;
  declare role: 'admin' | 'contributor' | 'groupLeader' | 'subscriber';
  declare signInType: 'withPassword' | 'passwordless' | 'microsoftEntraID';
  declare isActive: boolean;
  declare invitationStatus:
    | 'none'
    | 'pending'
    | 'sent'
    | 'accepted'
    | 'expired';
  declare invitationSentAt: Date | null;
  declare invitationAcceptedAt: Date | null;
  declare microsoftUserId: string | null; // Store Microsoft user ID for linking
  declare createdAt: Date;
  declare updatedAt: Date;

  // Existing association methods
  declare getGroupUsers: () => Promise<IGroupUser[]>;
  declare addGroupUser: (groupUser: IGroupUser) => Promise<void>;
  declare removeGroupUser: (groupUser: IGroupUser) => Promise<void>;
  declare hasGroupUser: (groupUser: IGroupUser) => Promise<boolean>;
  declare countGroupUsers: () => Promise<number>;
  declare createGroupUser: (groupUserData: any) => Promise<IGroupUser>;

  declare getOTPs: () => Promise<IOTP[]>;
  declare createOTP: (otpData: any) => Promise<IOTP>;

  // Course association methods
  declare getCreatedCourses: () => Promise<ICourse[]>;
  declare addCreatedCourse: (course: ICourse) => Promise<void>;
  declare removeCreatedCourse: (course: ICourse) => Promise<void>;
  declare hasCreatedCourse: (course: ICourse) => Promise<boolean>;
  declare countCreatedCourses: () => Promise<number>;
  declare createCreatedCourse: (courseData: any) => Promise<ICourse>;

  declare getEnrolledCourses: () => Promise<ICourse[]>;
  declare addEnrolledCourse: (course: ICourse) => Promise<void>;
  declare removeEnrolledCourse: (course: ICourse) => Promise<void>;
  declare hasEnrolledCourse: (course: ICourse) => Promise<boolean>;
  declare countEnrolledCourses: () => Promise<number>;

  // Attack simulation methods
  declare getCreatedAttackSimulations: () => Promise<IAttackSimulation[]>;
  declare addCreatedAttackSimulation: (
    attackSim: IAttackSimulation
  ) => Promise<void>;
  declare removeCreatedAttackSimulation: (
    attackSim: IAttackSimulation
  ) => Promise<void>;
  declare hasCreatedAttackSimulation: (
    attackSim: IAttackSimulation
  ) => Promise<boolean>;
  declare countCreatedAttackSimulations: () => Promise<number>;
  declare createCreatedAttackSimulation: (
    attackSimData: any
  ) => Promise<IAttackSimulation>;

  declare getLessonProgress: () => Promise<ICourseLessonProgress[]>;
  declare createLessonProgress: (
    progressData: any
  ) => Promise<ICourseLessonProgress>;

  // Bundle purchase association methods
  declare getBundlePurchases: () => Promise<any[]>;
  declare addBundlePurchase: (bundlePurchase: any) => Promise<void>;
  declare removeBundlePurchase: (bundlePurchase: any) => Promise<void>;
  declare hasBundlePurchase: (bundlePurchase: any) => Promise<boolean>;
  declare countBundlePurchases: () => Promise<number>;
  declare createBundlePurchase: (bundlePurchaseData: any) => Promise<any>;

  // Groups created by user association methods
  declare getCreatedGroups: () => Promise<any[]>;
  declare addCreatedGroup: (group: any) => Promise<void>;
  declare removeCreatedGroup: (group: any) => Promise<void>;
  declare hasCreatedGroup: (group: any) => Promise<boolean>;
  declare countCreatedGroups: () => Promise<number>;
  declare createCreatedGroup: (groupData: any) => Promise<any>;

  // Schedule attack simulation methods
  declare getScheduledAttackSimulations: () => Promise<any[]>;
  declare addScheduledAttackSimulation: (schedule: any) => Promise<void>;
  declare removeScheduledAttackSimulation: (schedule: any) => Promise<void>;
  declare hasScheduledAttackSimulation: (schedule: any) => Promise<boolean>;
  declare countScheduledAttackSimulations: () => Promise<number>;
  declare createScheduledAttackSimulation: (scheduleData: any) => Promise<any>;

  // Inside the User class, add these new method declarations:
  declare getScheduleEmailsAsRecipient: () => Promise<any[]>;
  declare addScheduleEmailAsRecipient: (scheduleEmail: any) => Promise<void>;
  declare removeScheduleEmailAsRecipient: (scheduleEmail: any) => Promise<void>;
  declare hasScheduleEmailAsRecipient: (scheduleEmail: any) => Promise<boolean>;
  declare countScheduleEmailsAsRecipient: () => Promise<number>;

  // Helper methods for invitation status
  isInvitationPending(): boolean {
    return (
      this.invitationStatus === 'pending' || this.invitationStatus === 'sent'
    );
  }

  isInvitationAccepted(): boolean {
    return this.invitationStatus === 'accepted';
  }

  canSignIn(): boolean {
    if (this.signInType === 'microsoftEntraID') {
      return this.isInvitationAccepted() && this.isActive;
    }
    return this.isActive;
  }

  static associate(models: any) {
    // Existing associations
    User.hasMany(models.GroupUser, {
      foreignKey: 'userId',
      as: 'groupUsers',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    User.belongsToMany(models.Group, {
      through: models.GroupUser,
      foreignKey: 'userId',
      otherKey: 'groupId',
      as: 'groups',
    });

    User.hasMany(models.OTP, {
      foreignKey: 'userId',
      as: 'otps',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Course associations
    User.hasMany(models.Course, {
      foreignKey: 'createdBy',
      as: 'createdCourses',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    User.hasMany(models.AttackSimulation, {
      foreignKey: 'createdBy',
      as: 'createdAttackSimulations',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    User.hasMany(models.Lesson, {
      foreignKey: 'createdBy',
      as: 'createdLessons',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    User.belongsToMany(models.Course, {
      through: models.UserCourse,
      foreignKey: 'userId',
      otherKey: 'courseId',
      as: 'enrolledCourses',
    });

    User.hasMany(models.CourseLessonProgress, {
      foreignKey: 'userId',
      as: 'lessonProgress',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // NEW ASSOCIATIONS FOR PURCHASE SYSTEM
    User.hasMany(models.BundlePurchase, {
      foreignKey: 'purchasedBy',
      as: 'bundlePurchases',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    // Groups created by user
    User.hasMany(models.Group, {
      foreignKey: 'createdBy',
      as: 'createdGroups',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    // Schedule attack simulations created by user
    User.hasMany(models.ScheduleAttackSimulation, {
      foreignKey: 'createdBy',
      as: 'scheduledAttackSimulations',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    // Schedule Email
    User.hasMany(models.ScheduleEmail, {
      foreignKey: 'createdBy',
      as: 'scheduledEmails',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    // Direct association with junction table
    User.hasMany(models.ScheduleEmailRecipient, {
      foreignKey: 'userId',
      as: 'scheduleEmailRecipients',
      onDelete: 'CASCADE',
    });

    // Many-to-many association with ScheduleEmail (as recipient)
    User.belongsToMany(models.ScheduleEmail, {
      through: models.ScheduleEmailRecipient,
      foreignKey: 'userId',
      otherKey: 'scheduleEmailId',
      as: 'scheduleEmailsAsRecipient',
    });
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'contributor', 'groupLeader', 'subscriber'),
      allowNull: false,
    },
    signInType: {
      type: DataTypes.ENUM('withPassword', 'passwordless', 'microsoftEntraID'),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    invitationStatus: {
      type: DataTypes.ENUM('none', 'pending', 'sent', 'accepted', 'expired'),
      allowNull: false,
      defaultValue: 'none',
    },
    invitationSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    invitationAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    microsoftUserId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { fields: ['email'], name: 'idx_users_email', unique: true },
      { fields: ['role'], name: 'idx_users_role' },
      { fields: ['isActive'], name: 'idx_users_is_active' },
      { fields: ['invitationStatus'], name: 'idx_users_invitation_status' },
      {
        fields: ['microsoftUserId'],
        name: 'idx_users_microsoft_user_id',
        unique: true,
      },
    ],
    hooks: {
      async beforeUpdate(user: User, options: any) {
        if (user.changed('isActive') && user.isActive) {
          // For Microsoft users, also check invitation status
          if (
            user.signInType === 'microsoftEntraID' &&
            !user.isInvitationAccepted()
          ) {
            throw new AppError(
              'Cannot activate Microsoft Entra ID user with unaccepted invitation',
              400
            );
          }

          const groupUsers = await GroupUser.findAll({
            where: { userId: user.id },
            include: [
              {
                model: Group,
                as: 'group',
                attributes: ['id', 'isActive'],
              },
            ],
            transaction: options.transaction,
          });

          for (const groupUser of groupUsers) {
            const group = await groupUser.getGroup();
            if (group && !group.isActive) {
              throw new AppError(
                'Cannot activate user who is a member of an inactive group',
                400
              );
            }
          }
        }
      },
    },
  }
);

export default User;
