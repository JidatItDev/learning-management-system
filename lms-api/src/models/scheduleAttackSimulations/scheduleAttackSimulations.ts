import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { IGroup, IUser, IBundle, IUserCourse } from '../../types/models';
import { AppError } from '../../middleware/errorHandler';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import moment from 'moment-timezone';
import { BundleType } from '../bundles/bundles';

export enum Status {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum LaunchStatus {
  DELIVER_IMMEDIATELY = 'Deliver Immediately',
  SCHEDULE_LATER = 'Schedule Later',
}

class ScheduleAttackSimulation extends Model {
  declare id: string;
  declare name: string;
  declare groupIds: string[];
  declare userIds: string[] | null;
  declare bundleId: string;
  declare campaignType: BundleType;
  declare launchDate: string;
  declare launchTime: string;
  declare status: Status;
  declare launchStatus: LaunchStatus;
  declare timezone: string;
  declare createdBy: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Remove the groups association methods since we're using JSON array
  declare getBundle: () => Promise<IBundle>;
  declare setBundle: (bundle: IBundle) => Promise<void>;
  declare getCreatedByUser: () => Promise<IUser>;
  declare setCreatedByUser: (user: IUser) => Promise<void>;
  declare getUserCourses: () => Promise<IUserCourse[]>;
  declare setUserCourses: (userCourses: IUserCourse[]) => Promise<void>;

  // Custom method to get groups based on groupIds JSON array
  async getGroupsFromIds(): Promise<IGroup[]> {
    if (!this.groupIds || this.groupIds.length === 0) {
      return [];
    }
    
    const groups = await sequelize.models.Group.findAll({
      where: {
        id: this.groupIds
      },
      attributes: ['id', 'name', 'companyId']
    });
    
    return groups as IGroup[];
  }

  static associate(models: any) {
    // Remove the belongsToMany association with Group
    // Keep only direct foreign key relationships

    ScheduleAttackSimulation.belongsTo(models.Bundle, {
      foreignKey: 'bundleId',
      as: 'bundle',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    ScheduleAttackSimulation.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'createdByUser',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    ScheduleAttackSimulation.hasMany(models.UserCourse, {
      foreignKey: 'scheduleAttackSimulationId',
      as: 'userCourses',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
}

ScheduleAttackSimulation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name cannot be empty' },
      },
    },
    groupIds: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidGroupIds(value: string[] | null) {
          if (value && !Array.isArray(value)) {
            throw new AppError('groupIds must be an array of UUIDs', 400);
          }
          if (value?.some((id) => !uuidValidate(id))) {
            throw new AppError('All groupIds must be valid UUIDs', 400);
          }
        },
      },
    },
    userIds: {
      type: DataTypes.JSON,
      allowNull: true,
      validate: {
        isValidUserIds(value: string[] | null) {
          if (value && !Array.isArray(value)) {
            throw new AppError('userIds must be an array of UUIDs', 400);
          }
          if (value?.some((id) => !uuidValidate(id))) {
            throw new AppError('All userIds must be valid UUIDs', 400);
          }
        },
      },
    },
    bundleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Bundles', key: 'id' },
    },
    campaignType: {
      type: DataTypes.ENUM(...Object.values(BundleType)),
      allowNull: false,
    },
    launchDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isFuture(value: string, next: any) {
          if (
            this.launchStatus === LaunchStatus.SCHEDULE_LATER &&
            new Date(value) <= new Date()
          ) {
            throw new AppError(
              'launchDate must be in the future for Schedule Later mode',
              400
            );
          }
          next();
        },
      },
    },
    launchTime: {
      type: DataTypes.TIME,
      allowNull: false,
      validate: {
        isValidTime(value: string) {
          if (this.launchStatus === LaunchStatus.SCHEDULE_LATER) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            if (!timeRegex.test(value)) {
              throw new AppError('launchTime must be in HH:MM format', 400);
            }
          }
        },
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(Status)),
      allowNull: false,
      defaultValue: Status.DRAFT,
    },
    launchStatus: {
      type: DataTypes.ENUM(...Object.values(LaunchStatus)),
      allowNull: false,
      defaultValue: LaunchStatus.SCHEDULE_LATER,
    },
    timezone: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isValidTimezone(value: string) {
          if (!moment.tz.zone(value)) {
            throw new AppError('Invalid timezone', 400);
          }
        },
      },
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
    },
  },
  {
    sequelize,
    modelName: 'ScheduleAttackSimulation',
    tableName: 'ScheduleAttackSimulations',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { fields: ['bundleId'], name: 'idx_schedule_simulations_bundle_id' },
      { fields: ['createdBy'], name: 'idx_schedule_simulations_created_by' },
      { fields: ['status'], name: 'idx_schedule_simulations_status' },
      {
        fields: ['launchStatus'],
        name: 'idx_schedule_simulations_launch_status',
      },
      { fields: ['launchDate'], name: 'idx_schedule_simulations_launch_date' },
      {
        fields: ['campaignType'],
        name: 'idx_schedule_simulations_campaign_type',
      },
    ],
    hooks: {
      async beforeCreate(schedule: ScheduleAttackSimulation, options: any) {
        const user = await sequelize.models.User.findByPk(schedule.createdBy, {
          transaction: options.transaction,
        });
        if (!user) {
          throw new AppError('Invalid createdBy user ID', 400);
        }
        const bundle = await sequelize.models.Bundle.findByPk(
          schedule.bundleId,
          {
            transaction: options.transaction,
          }
        );
        if (!bundle) {
          throw new AppError('Invalid bundleId', 400);
        }
        if (schedule.groupIds?.length) {
          for (const groupId of schedule.groupIds) {
            const group = await sequelize.models.Group.findByPk(groupId, {
              transaction: options.transaction,
            });
            if (!group) {
              throw new AppError(`Invalid groupId: ${groupId}`, 400);
            }
          }
        }
        // REMOVED: User-group membership validation
        if (schedule.launchStatus === LaunchStatus.DELIVER_IMMEDIATELY) {
          const now = moment.tz(schedule.timezone || 'UTC');
          schedule.launchDate = now.format('YYYY-MM-DD');
          schedule.launchTime = now.format('HH:mm');
          schedule.status = Status.SCHEDULED;
        }
      },
      async beforeUpdate(schedule: ScheduleAttackSimulation, options: any) {
        if (schedule.changed('groupIds') && schedule.groupIds?.length) {
          for (const groupId of schedule.groupIds) {
            const group = await sequelize.models.Group.findByPk(groupId, {
              transaction: options.transaction,
            });
            if (!group) {
              throw new AppError(`Invalid groupId: ${groupId}`, 400);
            }
          }
        }
        if (schedule.changed('bundleId')) {
          const bundle = await sequelize.models.Bundle.findByPk(
            schedule.bundleId,
            {
              transaction: options.transaction,
            }
          );
          if (!bundle) {
            throw new AppError('Invalid bundleId', 400);
          }
        }
        // REMOVED: User-group membership validation
      },
    },
  }
);

export default ScheduleAttackSimulation;