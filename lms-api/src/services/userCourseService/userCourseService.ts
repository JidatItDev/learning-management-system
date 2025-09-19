import UserCourse, { CourseStatus } from '../../models/userCourses/userCourses';
import User from '../../models/users/users';
import Course from '../../models/courses/courses';
import ScheduleAttackSimulation, {
  Status as ScheduleStatus,
} from '../../models/scheduleAttackSimulations/scheduleAttackSimulations';
import AttackSimulation from '../../models/attackSimulations/attackSimulations';
import { AppError } from '../../middleware/errorHandler';
import { Op, Transaction, Optional } from 'sequelize';
import sequelize from '../../config/database';
import moment from 'moment-timezone';
import { UserRole } from '../../middleware/authenticator';
import { CourseLessonProgress, Lesson } from '../../models';
import {
  CreateUserCourseData,
  UpdateUserCourseData,
  UserCourseFilters,
  CourseLifecycleResult,
  LifecycleAction,
  BulkCreateUserCourseData,
  ScheduleProgress,
} from './userCourse.interface';

export class UserCourseService {
  /**
   * Get all user courses with filtering, pagination, and role-based visibility
   */
  async getAllUserCourses(
    filters: UserCourseFilters = {},
    requestingUserRole?: UserRole
  ) {
    try {
      const whereClause: any = {};

      if (filters.userId) {
        whereClause.userId = filters.userId;
      }
      if (filters.courseId) {
        whereClause.courseId = filters.courseId;
      }
      if (filters.scheduleAttackSimulationId) {
        whereClause.scheduleAttackSimulationId =
          filters.scheduleAttackSimulationId;
      }
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.visibility !== undefined) {
        whereClause.visibility = filters.visibility;
      }

      // Role-based visibility filter - Group Leaders and Subscribers only see visible courses
      if (
        requestingUserRole === UserRole.GROUP_LEADER ||
        requestingUserRole === UserRole.SUBSCRIBER
      ) {
        whereClause.visibility = true;
      }

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: userCourses } = await UserCourse.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            model: User,
            as: 'user',
            attributes: [
              'id',
              'firstName',
              'lastName',
              'email',
              'role',
              'signInType',
            ],
          },
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title', 'description'],
          },
          {
            model: ScheduleAttackSimulation,
            as: 'scheduleAttackSimulation',
            attributes: [
              'id',
              'name',
              'status',
              'launchStatus',
              'campaignType',
            ],
          },
          {
            model: AttackSimulation,
            as: 'attackSimulation',
            attributes: ['id', 'name', 'template', 'url'],
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);

      return {
        userCourses,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
      };
    } catch (error) {
      console.error('Error in getAllUserCourses:', error);
      throw new AppError('Failed to fetch user course enrollments', 500);
    }
  }

  /**
   * Get user course by ID with full details
   */
  async getUserCourseById(id: string) {
    try {
      if (!id) {
        throw new AppError('User course ID is required', 400);
      }

      const userCourse = await UserCourse.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: [
              'id',
              'firstName',
              'lastName',
              'email',
              'role',
              'signInType',
            ],
          },
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title', 'description'],
            include: [
              {
                model: AttackSimulation,
                as: 'attackSimulations',
                attributes: ['id', 'name', 'template', 'url', 'page', 'smtp'],
              },
            ],
          },
          {
            model: ScheduleAttackSimulation,
            as: 'scheduleAttackSimulation',
            attributes: [
              'id',
              'name',
              'status',
              'launchStatus',
              'campaignType',
            ],
          },
          {
            model: AttackSimulation,
            as: 'attackSimulation',
            attributes: ['id', 'name', 'template', 'url'],
          },
        ],
      });

      if (!userCourse) {
        throw new AppError('User course enrollment not found', 404);
      }

      return userCourse;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in getUserCourseById:', error);
      throw new AppError('Failed to fetch user course enrollment', 500);
    }
  }

  /**
   * Create a new user course enrollment
   */
  async createUserCourse(
    data: CreateUserCourseData,
    transaction?: Transaction
  ) {
    const tx = transaction || (await sequelize.transaction());
    try {
      if (!data.userId || !data.courseId) {
        throw new AppError('userId and courseId are required', 400);
      }

      // Check for existing enrollment only if not part of a scheduled simulation
      if (!data.scheduleAttackSimulationId) {
        const existingEnrollment = await UserCourse.findOne({
          where: {
            userId: data.userId,
            courseId: data.courseId,
            scheduleAttackSimulationId: null,
          },
          transaction: tx,
        });

        if (existingEnrollment) {
          throw new AppError('User is already enrolled in this course', 409);
        }
      }

      // Validate user exists
      const user = await User.findByPk(data.userId, { transaction: tx });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Validate course exists
      const course = await Course.findByPk(data.courseId, { transaction: tx });
      if (!course) {
        throw new AppError('Course not found', 404);
      }

      // Validate schedule if provided
      if (data.scheduleAttackSimulationId) {
        const schedule = await ScheduleAttackSimulation.findByPk(
          data.scheduleAttackSimulationId,
          { transaction: tx }
        );
        if (!schedule) {
          throw new AppError('Schedule attack simulation not found', 404);
        }
      }

      // Create user course
      const userCourse = await UserCourse.create(
        {
          userId: data.userId,
          courseId: data.courseId,
          scheduleAttackSimulationId: data.scheduleAttackSimulationId || null,
          launchDate: data.launchDate || null,
          expiryDate: data.expiryDate || null,
          status: data.status || CourseStatus.PENDING,
          visibility: data.visibility !== undefined ? data.visibility : false,
        },
        { transaction: tx }
      );

      if (!transaction) {
        await tx.commit();
      }

      return await this.getUserCourseById(userCourse.id);
    } catch (error) {
      if (!transaction) {
        await tx.rollback();
      }
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in createUserCourse:', error);
      throw new AppError('Failed to enroll user in course', 500);
    }
  }

  /**
   * Bulk create user courses with transaction support
   */
  async bulkCreateUserCourses(
    data: readonly Optional<any, string>[] | BulkCreateUserCourseData[],
    transaction?: Transaction
  ) {
    const tx = transaction || (await sequelize.transaction());
    try {
      if (!data || data.length === 0) {
        throw new AppError('No user course data provided', 400);
      }

      // Validate all required fields
      for (const item of data) {
        if (!item.userId || !item.courseId) {
          throw new AppError(
            'userId and courseId are required for all records',
            400
          );
        }
      }

      // Bulk create user courses
      const userCourses = await UserCourse.bulkCreate(
        data.map((item: any) => ({
          userId: item.userId,
          courseId: item.courseId,
          scheduleAttackSimulationId: item.scheduleAttackSimulationId || null,
          launchDate: item.launchDate || null,
          expiryDate: item.expiryDate || null,
          status: item.status || CourseStatus.PENDING,
          visibility: item.visibility !== undefined ? item.visibility : false,
        })),
        {
          transaction: tx,
          validate: true,
          ignoreDuplicates: true,
          returning: true,
        }
      );

      if (!transaction) {
        await tx.commit();
      }

      return userCourses;
    } catch (error) {
      if (!transaction) {
        await tx.rollback();
      }
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in bulkCreateUserCourses:', error);
      throw new AppError('Failed to bulk enroll users in courses', 500);
    }
  }

  /**
   * Update user course with validation
   */
  async updateUserCourse(id: string, data: UpdateUserCourseData) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) {
        throw new AppError('User course ID is required', 400);
      }

      const userCourse = await UserCourse.findByPk(id, { transaction });
      if (!userCourse) {
        throw new AppError('User course enrollment not found', 404);
      }

      // Validate status transition if status is being updated
      if (data.status && data.status !== userCourse.status) {
        this.validateStatusTransition(userCourse.status, data.status);
      }

      // Update user course
      const updateData: any = {};
      if (data.launchDate !== undefined)
        updateData.launchDate = data.launchDate;
      if (data.expiryDate !== undefined)
        updateData.expiryDate = data.expiryDate;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.visibility !== undefined)
        updateData.visibility = data.visibility;
      if (data.attackSimulationId !== undefined)
        updateData.attackSimulationId = data.attackSimulationId;

      await userCourse.update(updateData, { transaction });

      await transaction.commit();
      return await this.getUserCourseById(id);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in updateUserCourse:', error);
      throw new AppError('Failed to update user course enrollment', 500);
    }
  }

  /**
   * Delete user course and cleanup related data
   */
  async deleteUserCourse(id: string) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) {
        throw new AppError('User course ID is required', 400);
      }

      const userCourse = await UserCourse.findByPk(id, { transaction });
      if (!userCourse) {
        throw new AppError('User course enrollment not found', 404);
      }

      // Clean up lesson progress
      const lessonIds = await Lesson.findAll({
        where: { courseId: userCourse.courseId },
        attributes: ['id'],
        transaction,
      }).then((lessons) => lessons.map((l) => l.id));

      if (lessonIds.length > 0) {
        await CourseLessonProgress.destroy({
          where: {
            userId: userCourse.userId,
            lessonId: { [Op.in]: lessonIds },
          },
          transaction,
        });
      }

      await userCourse.destroy({ transaction });

      await transaction.commit();
      return { message: 'User unenrolled from course successfully' };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Error in deleteUserCourse:', error);
      throw new AppError('Failed to unenroll user from course', 500);
    }
  }

  /**
   * Get courses visible to user based on role and visibility settings
   */
  async getUserVisibleCourses(userId: string, userRole: UserRole) {
    try {
      const whereClause: any = { userId };

      // Role-based visibility - Group Leaders and Subscribers only see visible courses
      if (
        userRole === UserRole.GROUP_LEADER ||
        userRole === UserRole.SUBSCRIBER
      ) {
        whereClause.visibility = true;
        // Also ensure they only see active courses
        whereClause.status = CourseStatus.ACTIVE;
      }

      const userCourses = await UserCourse.findAll({
        where: whereClause,
        order: [['launchDate', 'ASC']],
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['id', 'title', 'description'],
          },
          {
            model: ScheduleAttackSimulation,
            as: 'scheduleAttackSimulation',
            attributes: ['id', 'name', 'campaignType'],
          },
        ],
      });

      return userCourses;
    } catch (error) {
      console.error('Error in getUserVisibleCourses:', error);
      throw new AppError('Failed to fetch user visible courses', 500);
    }
  }

  /**
   * Get active courses for a specific user
   */
  async getActiveUserCourses(userId: string, userRole?: UserRole) {
    try {
      const whereClause: any = {
        userId,
        status: CourseStatus.ACTIVE,
      };

      // Apply visibility filter for non-admin users
      if (
        userRole === UserRole.GROUP_LEADER ||
        userRole === UserRole.SUBSCRIBER
      ) {
        whereClause.visibility = true;
      }

      return await this.getAllUserCourses(whereClause);
    } catch (error) {
      console.error('Error in getActiveUserCourses:', error);
      throw new AppError('Failed to fetch active user courses', 500);
    }
  }

  /**
   * Process expired courses and handle lifecycle transitions
   */
  async processExpiredCourses(): Promise<CourseLifecycleResult[]> {
    const transaction = await sequelize.transaction();
    const results: CourseLifecycleResult[] = [];

    try {
      const now = new Date();

      // 1. Find courses that should be activated
      const coursesToActivate = await UserCourse.findAll({
        where: {
          status: CourseStatus.PENDING,
          launchDate: { [Op.lte]: now },
        },
        transaction,
      });

      for (const course of coursesToActivate) {
        await course.update(
          {
            status: CourseStatus.ACTIVE,
            visibility: true,
          },
          { transaction }
        );

        results.push({
          action: LifecycleAction.ACTIVATED,
          userCourseId: course.id,
          userId: course.userId,
          courseId: course.courseId,
          scheduleId: course.scheduleAttackSimulationId ?? undefined,
          message: 'Course activated',
        });
      }

      // 2. Find courses that have expired
      const expiredCourses = await UserCourse.findAll({
        where: {
          status: CourseStatus.ACTIVE,
          expiryDate: { [Op.lt]: now },
        },
        include: [
          {
            model: ScheduleAttackSimulation,
            as: 'scheduleAttackSimulation',
            include: [{ association: 'bundle' }],
          },
        ],
        transaction,
      });

      for (const course of expiredCourses) {
        await course.update(
          {
            status: CourseStatus.EXPIRED,
            visibility: false, // Hide expired courses from users
          },
          { transaction }
        );

        results.push({
          action: LifecycleAction.EXPIRED,
          userCourseId: course.id,
          userId: course.userId,
          courseId: course.courseId,
          scheduleId: course.scheduleAttackSimulationId ?? undefined,
          message: 'Course expired',
        });

        // 3. Check for next course in sequence
        const nextCourse = await UserCourse.findOne({
          where: {
            userId: course.userId,
            scheduleAttackSimulationId: course.scheduleAttackSimulationId,
            status: CourseStatus.PENDING,
            launchDate: { [Op.gte]: course.expiryDate },
          },
          order: [['launchDate', 'ASC']],
          transaction,
        });

        if (
          nextCourse &&
          nextCourse.launchDate !== null &&
          nextCourse.launchDate <= now
        ) {
          await nextCourse.update(
            {
              status: CourseStatus.ACTIVE,
              visibility: true, // Make next course visible
            },
            { transaction }
          );

          results.push({
            action: LifecycleAction.ACTIVATED_NEXT,
            userCourseId: nextCourse.id,
            userId: nextCourse.userId,
            courseId: nextCourse.courseId,
            scheduleId: nextCourse.scheduleAttackSimulationId ?? undefined,
            message: 'Next course in sequence activated',
          });
        } else {
          // 4. Check if this was the last course and schedule is complete
          const remainingCourses = await UserCourse.count({
            where: {
              userId: course.userId,
              scheduleAttackSimulationId: course.scheduleAttackSimulationId,
              status: { [Op.in]: [CourseStatus.PENDING, CourseStatus.ACTIVE] },
            },
            transaction,
          });

          if (remainingCourses === 0) {
            // Mark schedule as completed
            if (course.scheduleAttackSimulationId) {
              await ScheduleAttackSimulation.update(
                { status: ScheduleStatus.COMPLETED },
                {
                  where: { id: course.scheduleAttackSimulationId },
                  transaction,
                }
              );
            }

            results.push({
              action: LifecycleAction.SCHEDULE_COMPLETED,
              userId: course.userId,
              scheduleId: course.scheduleAttackSimulationId ?? undefined,
              message: 'Schedule completed for user',
            });
          }

          // 5. Schedule attack simulation if applicable
          if (this.shouldScheduleAttackSimulation(course)) {
            results.push({
              action: LifecycleAction.ATTACK_SIMULATION_SCHEDULED,
              userCourseId: course.id,
              userId: course.userId,
              courseId: course.courseId,
              scheduleId: course.scheduleAttackSimulationId ?? undefined,
              message: 'Attack simulation scheduled',
            });
          }
        }
      }

      await transaction.commit();
      return results;
    } catch (error) {
      await transaction.rollback();
      console.error('Error in processExpiredCourses:', error);
      throw new AppError('Failed to process expired courses', 500);
    }
  }

  /**
   * Get schedule progress for a user
   */
  async getScheduleProgress(
    userId: string,
    scheduleId: string
  ): Promise<ScheduleProgress> {
    try {
      const userCourses = await UserCourse.findAll({
        where: {
          userId,
          scheduleAttackSimulationId: scheduleId,
        },
        order: [['launchDate', 'ASC']],
      });

      const totalCourses = userCourses.length;
      const completedCourses = userCourses.filter(
        (course) =>
          course.status === CourseStatus.EXPIRED ||
          course.status === CourseStatus.COMPLETED
      ).length;

      const activeCourse = userCourses.find(
        (course) => course.status === CourseStatus.ACTIVE
      );
      const nextCourse = userCourses.find(
        (course) => course.status === CourseStatus.PENDING
      );

      return {
        scheduleId,
        userId,
        totalCourses,
        completedCourses,
        activeCourse: activeCourse?.courseId,
        nextCourse: nextCourse?.courseId,
        isCompleted: completedCourses === totalCourses,
      };
    } catch (error) {
      console.error('Error in getScheduleProgress:', error);
      throw new AppError('Failed to get schedule progress', 500);
    }
  }

  /**
   * Check if user course exists
   */
  async userCourseExists(id: string): Promise<boolean> {
    try {
      const userCourse = await UserCourse.findByPk(id, {
        attributes: ['id'],
      });
      return !!userCourse;
    } catch (error) {
      console.error('Error in userCourseExists:', error);
      return false;
    }
  }

  /**
   * Get courses that need attack simulation launch
   */
  async getCoursesForAttackSimulation(): Promise<UserCourse[]> {
    try {
      const oneDayAgo = moment().subtract(1, 'day').toDate();

      return await UserCourse.findAll({
        where: {
          status: CourseStatus.EXPIRED,
          expiryDate: {
            [Op.between]: [
              moment(oneDayAgo).startOf('day').toDate(),
              moment(oneDayAgo).endOf('day').toDate(),
            ],
          },
          attackSimulationId: null,
          scheduleAttackSimulationId: { [Op.not]: null },
        },
        include: [
          {
            model: ScheduleAttackSimulation,
            as: 'scheduleAttackSimulation',
            include: [{ association: 'bundle' }],
          },
          {
            model: Course,
            as: 'course',
            include: [
              {
                model: AttackSimulation,
                as: 'attackSimulations',
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Error in getCoursesForAttackSimulation:', error);
      throw new AppError('Failed to get courses for attack simulation', 500);
    }
  }

  /**
   * Private helper methods
   */
  private validateStatusTransition(
    currentStatus: CourseStatus,
    newStatus: CourseStatus
  ): void {
    const validTransitions: Record<CourseStatus, CourseStatus[]> = {
      [CourseStatus.PENDING]: [CourseStatus.ACTIVE, CourseStatus.EXPIRED],
      [CourseStatus.ACTIVE]: [CourseStatus.EXPIRED, CourseStatus.COMPLETED],
      [CourseStatus.EXPIRED]: [CourseStatus.COMPLETED],
      [CourseStatus.COMPLETED]: [], // No transitions from completed
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        400
      );
    }
  }

  private shouldScheduleAttackSimulation(course: UserCourse): boolean {
    // Check if course has expired and no attack simulation has been scheduled
    return (
      course.status === CourseStatus.EXPIRED &&
      !course.attackSimulationId &&
      !!course.scheduleAttackSimulationId
    );
  }
}

export const userCourseService = new UserCourseService();
export type {
  CreateUserCourseData,
  UpdateUserCourseData,
  UserCourseFilters,
  CourseLifecycleResult,
  ScheduleProgress,
} from './userCourse.interface';
