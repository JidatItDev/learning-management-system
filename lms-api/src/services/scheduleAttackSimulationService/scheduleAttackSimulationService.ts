import ScheduleAttackSimulation, {
  Status,
  LaunchStatus,
} from '../../models/scheduleAttackSimulations/scheduleAttackSimulations';
import Group from '../../models/groups/groups';
import Bundle from '../../models/bundles/bundles';
import User from '../../models/users/users';
import GroupUser from '../../models/groupUsers/groupUsers';
import UserCourse from '../../models/userCourses/userCourses';
import { userCourseService } from '../userCourseService/userCourseService';
import { AppError } from '../../middleware/errorHandler';
import { Op, Transaction } from 'sequelize';
import sequelize from '../../config/database';
import moment from 'moment-timezone';
import { BundleType } from '../../models/bundles/bundles';
import {
  CreateScheduleAttackSimulationData,
  ScheduleAttackSimulationFilters,
  UpdateScheduleAttackSimulationData,
} from './scheduleAttackSimulation.interface';

export class ScheduleAttackSimulationService {
  async getAllScheduleAttackSimulations(
    filters: ScheduleAttackSimulationFilters = {}
  ) {
    try {
      const whereClause: any = {};
      if (filters.groupId)
        whereClause.groupIds = { [Op.contains]: [filters.groupId] };
      if (filters.bundleId) whereClause.bundleId = filters.bundleId;
      if (filters.status) whereClause.status = filters.status;
      if (filters.launchStatus) whereClause.launchStatus = filters.launchStatus;

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: schedules } =
        await ScheduleAttackSimulation.findAndCountAll({
          where: whereClause,
          order: [['createdAt', 'DESC']],
          limit,
          offset,
          include: [
            {
              association: 'bundle',
              attributes: ['id', 'title', 'bundleType'],
              required: false,
            },
            {
              association: 'createdByUser',
              attributes: ['id', 'firstName', 'lastName', 'email'],
              required: false,
            },
            {
              association: 'userCourses',
              attributes: [
                'id',
                'userId',
                'courseId',
                'launchDate',
                'expiryDate',
                'visibility',
              ],
              required: false,
            },
          ],
        });

      // Manually fetch groups and handle bundles for each schedule
      const schedulesWithGroups = await Promise.all(
        schedules.map(async (schedule) => {
          const scheduleJson = schedule.toJSON();

          // Handle bundle manually if not loaded via association
          if (!scheduleJson.bundle && schedule.bundleId) {
            const bundle = await Bundle.findByPk(schedule.bundleId, {
              attributes: ['id', 'title', 'bundleType'],
            });
            if (bundle) {
              scheduleJson.bundle = bundle.toJSON();
            }
          }

          const groupIdsArray = parseStringArray(schedule.groupIds);
          //const userIdsArray = parseStringArray(schedule.userIds); // for future use

          if (groupIdsArray.length > 0) {
            const groups = await Group.findAll({
              where: { id: { [Op.in]: groupIdsArray } },
              attributes: ['id', 'name', 'companyId'],
            });
            scheduleJson.groups = groups.map((g) => g.toJSON());
          } else {
            scheduleJson.groups = [];
          }
          return scheduleJson;
        })
      );

      return {
        schedules: schedulesWithGroups,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(count / limit),
          hasPreviousPage: page > 1,
          nextPage: page < Math.ceil(count / limit) ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
      };
    } catch (error) {
      throw new AppError('Failed to fetch scheduled attack simulations', 500);
    }
  }

  async getScheduleAttackSimulationById(id: string) {
    try {
      if (!id) throw new AppError('Schedule ID is required', 400);

      const schedule = await ScheduleAttackSimulation.findByPk(id, {
        attributes: [
          'id',
          'name',
          'groupIds',
          'userIds',
          'bundleId',
          'campaignType',
          'launchDate',
          'launchTime',
          'status',
          'launchStatus',
          'timezone',
          'createdBy',
          'createdAt',
          'updatedAt',
        ],
        include: [
          {
            association: 'bundle',
            attributes: ['id', 'title', 'bundleType'],
            required: false, // Make it optional in case of missing bundle
          },
          {
            association: 'createdByUser',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false,
          },
          {
            association: 'userCourses',
            attributes: [
              'id',
              'userId',
              'courseId',
              'launchDate',
              'expiryDate',
              'visibility',
            ],
            required: false,
          },
        ],
      });

      if (!schedule)
        throw new AppError('Scheduled attack simulation not found', 404);

      // Convert to JSON and manually add groups and handle bundle
      const scheduleJson = schedule.toJSON();

      // Handle bundle manually if not loaded via association
      if (!scheduleJson.bundle && schedule.bundleId) {
        const bundle = await Bundle.findByPk(schedule.bundleId, {
          attributes: ['id', 'title', 'bundleType'],
        });
        if (bundle) {
          scheduleJson.bundle = bundle.toJSON();
        }
      }

      const groupIdsArray = parseStringArray(schedule.groupIds);
      //const userIdsArray = parseStringArray(schedule.userIds); // for future use

      if (groupIdsArray.length > 0) {
        const groups = await Group.findAll({
          where: { id: { [Op.in]: groupIdsArray } },
          attributes: ['id', 'name', 'companyId'],
        });
        scheduleJson.groups = groups.map((g) => g.toJSON());
      } else {
        scheduleJson.groups = [];
      }

      return scheduleJson;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch scheduled attack simulation', 500);
    }
  }

  async createScheduleAttackSimulation(
    data: CreateScheduleAttackSimulationData & { createdBy: string }
  ) {
    let transaction: Transaction | null = null;
    let isTransactionCommitted = false;

    try {
      transaction = await sequelize.transaction();

      // Validate required fields
      if (
        !data.name ||
        !data.bundleId ||
        !data.campaignType ||
        !data.launchStatus ||
        !data.timezone ||
        (!data.groupIds && !data.userIds) ||
        !data.courseIds ||
        !data.courseIds.length
      ) {
        throw new AppError(
          'name, bundleId, campaignType, launchStatus, timezone, courseIds, and either groupIds or userIds are required',
          400
        );
      }

      // Validate launchDate and launchTime for Schedule Later
      if (data.launchStatus === LaunchStatus.SCHEDULE_LATER) {
        if (!data.launchDate || !data.launchTime) {
          throw new AppError(
            'launchDate and launchTime are required for Schedule Later',
            400
          );
        }
        if (!moment(data.launchDate, 'YYYY-MM-DD', true).isValid()) {
          throw new AppError('launchDate must be in YYYY-MM-DD format', 400);
        }
        if (!moment(data.launchTime, 'HH:mm', true).isValid()) {
          throw new AppError('launchTime must be in HH:mm format', 400);
        }
      }

      // Validate timezone
      if (!moment.tz.zone(data.timezone)) {
        throw new AppError('Invalid timezone', 400);
      }

      const bundle = await Bundle.findByPk(data.bundleId, { transaction });
      if (!bundle) throw new AppError('Bundle not found', 404);

      const user = await User.findByPk(data.createdBy, { transaction });
      if (!user) throw new AppError('CreatedBy user not found', 404);

      // Validate groupIds if provided
      if (data.groupIds?.length) {
        for (const groupId of data.groupIds) {
          const group = await Group.findByPk(groupId, { transaction });
          if (!group) throw new AppError(`Group ${groupId} not found`, 404);
        }
      }

      // Validate userIds if provided
      if (data.userIds?.length) {
        for (const userId of data.userIds) {
          const userExists = await User.findByPk(userId, { transaction });
          if (!userExists) throw new AppError(`User ${userId} not found`, 404);
        }
      }

      // Validate courseIds
      const courses = await sequelize.models.Course.findAll({
        where: { id: { [Op.in]: data.courseIds } },
        transaction,
      });
      if (courses.length !== data.courseIds.length) {
        throw new AppError('Some courseIds are invalid', 400);
      }

      // Set launchDate and launchTime for ScheduleAttackSimulation
      const now = moment.tz(data.timezone || 'UTC');
      const scheduleLaunchDate =
        data.launchStatus === LaunchStatus.DELIVER_IMMEDIATELY
          ? now.format('YYYY-MM-DD')
          : data.launchDate;

      const scheduleLaunchTime =
        data.launchStatus === LaunchStatus.DELIVER_IMMEDIATELY
          ? now.format('HH:mm')
          : data.launchTime;

      // Create schedule
      const schedule = await ScheduleAttackSimulation.create(
        {
          name: data.name,
          groupIds: data.groupIds,
          userIds: data.userIds,
          bundleId: data.bundleId,
          campaignType: data.campaignType,
          launchDate: scheduleLaunchDate,
          launchTime: scheduleLaunchTime,
          status:
            data.launchStatus === LaunchStatus.DELIVER_IMMEDIATELY
              ? Status.SCHEDULED
              : data.status || Status.DRAFT,
          launchStatus: data.launchStatus,
          timezone: data.timezone,
          createdBy: data.createdBy,
        },
        { transaction }
      );

      // Collect all target userIds
      const targetUserIds = new Set<string>();
      if (data.groupIds?.length) {
        const groupUsers = await GroupUser.findAll({
          where: { groupId: { [Op.in]: data.groupIds } },
          attributes: ['userId'],
          transaction,
        });
        groupUsers.forEach((gu) => targetUserIds.add(gu.userId));
      }
      if (data.userIds?.length) {
        data.userIds.forEach((userId) => targetUserIds.add(userId));
      }

      // Set launchDate for UserCourse records
      const userCourseLaunchDate =
        data.launchStatus === LaunchStatus.DELIVER_IMMEDIATELY
          ? now.format('YYYY-MM-DD HH:mm:ss')
          : `${data.launchDate} ${data.launchTime}`;

      console.log(
        'Debug - User Course Launch Date String:',
        userCourseLaunchDate
      );
      console.log('Debug - Timezone:', data.timezone);
      console.log('Debug - Launch Status:', data.launchStatus);

      const userCourseData: any[] = [];
      let currentLaunchDate = moment.tz(userCourseLaunchDate, data.timezone);

      console.log(
        'Debug - Parsed Current Launch Date:',
        currentLaunchDate.toString()
      );
      console.log('Debug - Is Valid:', currentLaunchDate.isValid());

      if (!currentLaunchDate.isValid()) {
        console.error('Debug - Failed to parse date/time:', {
          userCourseLaunchDate,
          timezone: data.timezone,
          launchDate: data.launchDate,
          launchTime: data.launchTime,
          launchStatus: data.launchStatus,
        });
        throw new AppError('Invalid launch date/time combination', 400);
      }

      data.courseIds.forEach((courseId, index) => {
        const expiryDate = currentLaunchDate.clone().add(21, 'days');
        targetUserIds.forEach((userId) => {
          userCourseData.push({
            userId,
            courseId,
            scheduleAttackSimulationId: schedule.id,
            launchDate: currentLaunchDate.toDate(),
            expiryDate: expiryDate.toDate(),
            visibility:
              data.launchStatus === LaunchStatus.DELIVER_IMMEDIATELY &&
              index === 0,
            status:
              data.launchStatus === LaunchStatus.DELIVER_IMMEDIATELY &&
              index === 0
                ? 'active'
                : 'pending',
          });
        });
        currentLaunchDate = expiryDate.clone().add(1, 'day');
      });

      await userCourseService.bulkCreateUserCourses(
        userCourseData,
        transaction
      );

      await transaction.commit();
      isTransactionCommitted = true;

      try {
        return await this.getScheduleAttackSimulationById(schedule.id);
      } catch (fetchError) {
        console.error('Error fetching created schedule:', fetchError);
        return {
          id: schedule.id,
          message: 'Schedule created successfully, but failed to fetch details',
        };
      }
    } catch (error) {
      if (transaction && !isTransactionCommitted) {
        await transaction.rollback();
      }
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create scheduled attack simulation', 500);
    }
  }

  async updateScheduleAttackSimulation(
    id: string,
    data: UpdateScheduleAttackSimulationData
  ) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) throw new AppError('Schedule ID is required', 400);

      const schedule = await ScheduleAttackSimulation.findByPk(id, {
        transaction,
      });
      if (!schedule)
        throw new AppError('Scheduled attack simulation not found', 404);

      // Validate launchDate and launchTime for Schedule Later
      if (data.launchStatus === LaunchStatus.SCHEDULE_LATER) {
        if (
          data.launchDate &&
          !moment(data.launchDate, 'YYYY-MM-DD', true).isValid()
        ) {
          throw new AppError('launchDate must be in YYYY-MM-DD format', 400);
        }
        if (
          data.launchTime &&
          !moment(data.launchTime, 'HH:mm', true).isValid()
        ) {
          throw new AppError('launchTime must be in HH:mm format', 400);
        }
      }

      // Validate timezone
      if (data.timezone && !moment.tz.zone(data.timezone)) {
        throw new AppError('Invalid timezone', 400);
      }

      // Validate groupIds if provided
      if (data.groupIds?.length) {
        for (const groupId of data.groupIds) {
          const group = await Group.findByPk(groupId, { transaction });
          if (!group) throw new AppError(`Group ${groupId} not found`, 404);
        }
      }

      // Validate bundleId if provided
      if (data.bundleId) {
        const bundle = await Bundle.findByPk(data.bundleId, { transaction });
        if (!bundle) throw new AppError('Bundle not found', 404);
      }

      // Validate userIds if provided
      if (data.userIds?.length) {
        for (const userId of data.userIds) {
          const userExists = await User.findByPk(userId, { transaction });
          if (!userExists) throw new AppError(`User ${userId} not found`, 404);
        }
      }

      // Handle courseIds update
      if (data.courseIds?.length) {
        const courses = await sequelize.models.Course.findAll({
          where: { id: { [Op.in]: data.courseIds } },
          transaction,
        });
        if (courses.length !== data.courseIds.length) {
          throw new AppError('Some courseIds are invalid', 400);
        }

        await UserCourse.destroy({
          where: { scheduleAttackSimulationId: id },
          transaction,
        });

        const targetUserIds = new Set<string>();
        const groupIds =
          data.groupIds !== undefined ? data.groupIds : schedule.groupIds;
        const userIds =
          data.userIds !== undefined ? data.userIds : schedule.userIds;

        if (groupIds?.length) {
          const groupUsers = await GroupUser.findAll({
            where: { groupId: { [Op.in]: groupIds } },
            attributes: ['userId'],
            transaction,
          });
          groupUsers.forEach((gu) => targetUserIds.add(gu.userId));
        }

        if (userIds?.length) {
          userIds.forEach((userId) => targetUserIds.add(userId));
        }

        const now = moment.tz(data.timezone || schedule.timezone || 'UTC');
        const userCourseLaunchDate =
          (data.launchStatus || schedule.launchStatus) ===
          LaunchStatus.DELIVER_IMMEDIATELY
            ? now.format('YYYY-MM-DD HH:mm:ss')
            : `${data.launchDate || schedule.launchDate} ${data.launchTime || schedule.launchTime}`;

        const userCourseData: any[] = [];
        let currentLaunchDate = moment.tz(
          userCourseLaunchDate,
          data.timezone || schedule.timezone
        );

        if (!currentLaunchDate.isValid()) {
          throw new AppError('Invalid launch date/time combination', 400);
        }

        data.courseIds.forEach((courseId, index) => {
          const expiryDate = currentLaunchDate.clone().add(21, 'days');
          targetUserIds.forEach((userId) => {
            userCourseData.push({
              userId,
              courseId,
              scheduleAttackSimulationId: id,
              launchDate: currentLaunchDate.toDate(),
              expiryDate: expiryDate.toDate(),
              visibility:
                (data.launchStatus || schedule.launchStatus) ===
                  LaunchStatus.DELIVER_IMMEDIATELY && index === 0,
              status:
                (data.launchStatus || schedule.launchStatus) ===
                  LaunchStatus.DELIVER_IMMEDIATELY && index === 0
                  ? 'active'
                  : 'pending',
            });
          });
          currentLaunchDate = expiryDate.clone().add(1, 'day');
        });

        await userCourseService.bulkCreateUserCourses(
          userCourseData,
          transaction
        );
      }

      // Update schedule fields
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.groupIds !== undefined) updateData.groupIds = data.groupIds;
      if (data.userIds !== undefined) updateData.userIds = data.userIds;
      if (data.bundleId !== undefined) updateData.bundleId = data.bundleId;
      if (data.campaignType !== undefined)
        updateData.campaignType = data.campaignType;
      if (data.launchStatus === LaunchStatus.DELIVER_IMMEDIATELY) {
        const now = moment.tz(data.timezone || schedule.timezone || 'UTC');
        updateData.launchDate = now.format('YYYY-MM-DD');
        updateData.launchTime = now.format('HH:mm');
      } else {
        if (data.launchDate !== undefined)
          updateData.launchDate = data.launchDate;
        if (data.launchTime !== undefined)
          updateData.launchTime = data.launchTime;
      }
      if (data.timezone !== undefined) updateData.timezone = data.timezone;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.launchStatus !== undefined)
        updateData.launchStatus = data.launchStatus;

      await schedule.update(updateData, { transaction });

      await transaction.commit();

      return await this.getScheduleAttackSimulationById(id);
    } catch (error) {
      if (transaction) await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update scheduled attack simulation', 500);
    }
  }

  async deleteScheduleAttackSimulation(id: string) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) throw new AppError('Schedule ID is required', 400);

      const schedule = await ScheduleAttackSimulation.findByPk(id, {
        transaction,
      });
      if (!schedule)
        throw new AppError('Scheduled attack simulation not found', 404);

      await schedule.destroy({ transaction });

      await transaction.commit();
      return { message: 'Scheduled attack simulation deleted successfully' };
    } catch (error) {
      if (transaction) await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete scheduled attack simulation', 500);
    }
  }
}

function parseStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      console.error('Failed to parse string array:', value);
      return [];
    }
  }
  return [];
}

export const scheduleAttackSimulationService =
  new ScheduleAttackSimulationService();
