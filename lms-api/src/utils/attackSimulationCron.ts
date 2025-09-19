import cron from 'node-cron';
import moment from 'moment-timezone';
import axios from 'axios';
import { Op, Transaction } from 'sequelize';
import ScheduleAttackSimulation, {
  Status as ScheduleStatus,
  LaunchStatus,
} from '../models/scheduleAttackSimulations/scheduleAttackSimulations';
import UserCourse, { CourseStatus } from '../models/userCourses/userCourses';
import Course from '../models/courses/courses';
import AttackSimulation from '../models/attackSimulations/attackSimulations';
import { userCourseService } from '../services/userCourseService/userCourseService';
import { AppError } from '../middleware/errorHandler';
import sequelize from '../config/database';
import { BundleType } from '../models/bundles/bundles';

const GOPHISH_PUBLIC_URL =
  process.env.VITE_APP_GOPHISH_PUBLIC_SERVER_URL ||
  'https://phish.haxia.eu:3333/';
const GOPHISH_API_KEY =
  process.env.VITE_APP_GOPHISH_ACCOUNT_API ||
  '13eb084703ee55c36500621360e808aa7e45d71f33dc029bad3d5ef8b374151d';

interface CronJobStats {
  schedulesProcessed: number;
  coursesActivated: number;
  coursesExpired: number;
  attackSimulationsLaunched: number;
  errors: string[];
}

const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

const getErrorMessage = (error: unknown): string => {
  if (isError(error)) return error.message;
  return String(error);
};

const launchGoPhishCampaign = async (
  userCourse: UserCourse,
  schedule: ScheduleAttackSimulation
): Promise<string | null> => {
  try {
    if (!userCourse || !schedule) {
      console.error('❌ No userCourse or schedule data provided to launch GoPhish campaign');
      return null;
    }

    const course = (await Course.findByPk(userCourse.courseId, {
      include: [
        {
          model: AttackSimulation,
          as: 'attackSimulations',
          attributes: ['id', 'name', 'template', 'url', 'page', 'smtp'],
        },
      ],
    })) as Course & {
      attackSimulations?: AttackSimulation[];
    };

    if (!course || !course.attackSimulations || course.attackSimulations.length === 0) {
      console.error(`❌ No attack simulation found for course ID: ${userCourse.courseId}`);
      return null;
    }

    const attackSimulation = course.attackSimulations[0];

    const groupIds = schedule.groupIds || [];
    const groups = await sequelize.models.Group.findAll({
      where: { id: { [Op.in]: groupIds } },
      attributes: ['id', 'name'],
    });

    const groupNames = groups.map((g: any) => g.name as string);

    const apiData = {
      name: `${attackSimulation.name} - ${schedule.name} - Groups: ${groupNames.join(', ')}`,
      template: { name: attackSimulation.template },
      url: attackSimulation.url,
      page: { name: attackSimulation.page },
      smtp: { name: attackSimulation.smtp },
      launch_date: moment(userCourse.expiryDate).add(1, 'day').toISOString(),
      groups: groupNames.map((name) => ({ name })),
    };

    console.log(`🚀 Launching GoPhish campaign for course: ${course.title}`);

    const response = await axios.post(
      `${GOPHISH_PUBLIC_URL}/api/campaigns/?api_key=${GOPHISH_API_KEY}`,
      apiData,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    if (response.status === 201 && response.data?.id) {
      console.log(`✅ GoPhish campaign launched successfully for course ID: ${userCourse.courseId}`);
      await userCourse.update({
        attackSimulationId: attackSimulation.id,
        status: CourseStatus.COMPLETED,
      });
      return response.data.id;
    } else {
      console.error(`❌ Failed to launch GoPhish campaign for course ID: ${userCourse.courseId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error launching GoPhish campaign for course ID: ${userCourse?.courseId}:`, error);
    return null;
  }
};

const processScheduledSimulations = async (): Promise<CronJobStats> => {
  const transaction = await sequelize.transaction();
  const stats: CronJobStats = {
    schedulesProcessed: 0,
    coursesActivated: 0,
    coursesExpired: 0,
    attackSimulationsLaunched: 0,
    errors: [],
  };

  try {
    console.log('📋 Checking for scheduled simulations to start...');

    const schedulesToStart = await ScheduleAttackSimulation.findAll({
      where: {
        launchStatus: LaunchStatus.SCHEDULE_LATER,
        status: ScheduleStatus.SCHEDULED,
        [Op.and]: sequelize.literal(`CONCAT(launchDate, ' ', launchTime) <= NOW()`),
      },
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
      transaction,
    });

    for (const schedule of schedulesToStart) {
      try {
        await schedule.update(
          { launchStatus: LaunchStatus.DELIVER_IMMEDIATELY, status: ScheduleStatus.SCHEDULED },
          { transaction }
        );

        const firstCourses = await UserCourse.findAll({
          where: {
            scheduleAttackSimulationId: schedule.id,
            status: CourseStatus.PENDING,
            launchDate: { [Op.lte]: new Date() },
          },
          order: [['launchDate', 'ASC']],
          transaction,
        });

        if (firstCourses.length > 0) {
          const firstLaunchDate = firstCourses[0].launchDate;
          const [updatedCount] = await UserCourse.update(
            { status: CourseStatus.ACTIVE, visibility: true },
            {
              where: {
                scheduleAttackSimulationId: schedule.id,
                launchDate: firstLaunchDate,
                status: CourseStatus.PENDING,
              },
              transaction,
            }
          );

          stats.coursesActivated += updatedCount;
          console.log(`✅ Started schedule: ${schedule.name} (ID: ${schedule.id}) - Activated ${updatedCount} courses`);
        }

        stats.schedulesProcessed++;
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        stats.errors.push(`Error processing schedule ${schedule.id}: ${errorMessage}`);
        console.error(`❌ Error processing schedule ${schedule.id}:`, error);
      }
    }

    await transaction.commit();
    return stats;
  } catch (error) {
    await transaction.rollback();
    const errorMessage = getErrorMessage(error);
    stats.errors.push(`Transaction error in processScheduledSimulations: ${errorMessage}`);
    console.error('❌ Error in processScheduledSimulations:', error);
    return stats;
  }
};

const processCourseLifecycle = async (): Promise<CronJobStats> => {
  const transaction = await sequelize.transaction();
  const stats: CronJobStats = {
    schedulesProcessed: 0,
    coursesActivated: 0,
    coursesExpired: 0,
    attackSimulationsLaunched: 0,
    errors: [],
  };

  try {
    console.log('📋 Processing course lifecycle...');
    const now = new Date();

    const coursesToActivate = await UserCourse.findAll({
      where: {
        status: CourseStatus.PENDING,
        launchDate: { [Op.lte]: now },
        visibility: false,
      },
      transaction,
    });

    for (const course of coursesToActivate) {
      await course.update(
        { status: CourseStatus.ACTIVE, visibility: true },
        { transaction }
      );
      stats.coursesActivated++;
    }

    const coursesToExpire = await UserCourse.findAll({
      where: {
        status: CourseStatus.ACTIVE,
        expiryDate: { [Op.lt]: now },
      },
      include: [
        {
          model: ScheduleAttackSimulation,
          as: 'scheduleAttackSimulation',
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
        },
      ],
      transaction,
    });

    for (const course of coursesToExpire) {
      await course.update(
        { status: CourseStatus.EXPIRED, visibility: false },
        { transaction }
      );
      stats.coursesExpired++;

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

      if (nextCourse && nextCourse.launchDate && nextCourse.launchDate <= now) {
        await nextCourse.update(
          { status: CourseStatus.ACTIVE, visibility: true },
          { transaction }
        );
        stats.coursesActivated++;
      }
    }

    await transaction.commit();

    if (stats.coursesActivated > 0 || stats.coursesExpired > 0) {
      console.log(`✅ Course lifecycle processed - Activated: ${stats.coursesActivated}, Expired: ${stats.coursesExpired}`);
    }

    return stats;
  } catch (error) {
    await transaction.rollback();
    const errorMessage = getErrorMessage(error);
    stats.errors.push(`Transaction error in processCourseLifecycle: ${errorMessage}`);
    console.error('❌ Error in processCourseLifecycle:', error);
    return stats;
  }
};

const processAttackSimulationLaunches = async (): Promise<CronJobStats> => {
  const stats: CronJobStats = {
    schedulesProcessed: 0,
    coursesActivated: 0,
    coursesExpired: 0,
    attackSimulationsLaunched: 0,
    errors: [],
  };

  try {
    console.log('📋 Processing attack simulation launches...');

    const yesterday = moment().subtract(1, 'day');

    const coursesForAttackSim = (await UserCourse.findAll({
      where: {
        status: CourseStatus.EXPIRED,
        expiryDate: {
          [Op.between]: [yesterday.startOf('day').toDate(), yesterday.endOf('day').toDate()],
        },
        attackSimulationId: null,
        scheduleAttackSimulationId: { [Op.not]: null },
      },
      include: [
        {
          model: ScheduleAttackSimulation,
          as: 'scheduleAttackSimulation',
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
            { association: 'bundle', attributes: ['id', 'bundleType'] },
          ],
        },
      ],
    })) as (UserCourse & {
      scheduleAttackSimulation?: ScheduleAttackSimulation & {
        bundle?: { id: string; bundleType: BundleType };
      };
    })[];

    for (const userCourse of coursesForAttackSim) {
      try {
        const schedule = userCourse.scheduleAttackSimulation;
        if (!schedule) continue;

        const campaignId = await launchGoPhishCampaign(userCourse, schedule);
        if (campaignId) stats.attackSimulationsLaunched++;
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        stats.errors.push(`Error launching attack simulation for course ${userCourse.id}: ${errorMessage}`);
        console.error(`❌ Error launching attack simulation for course ${userCourse.id}:`, error);
      }
    }

    if (stats.attackSimulationsLaunched > 0) {
      console.log(`✅ Processed ${stats.attackSimulationsLaunched} attack simulation launches`);
    }

    return stats;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    stats.errors.push(`Error in processAttackSimulationLaunches: ${errorMessage}`);
    console.error('❌ Error in processAttackSimulationLaunches:', error);
    return stats;
  }
};

const withErrorHandling =
  (fn: () => Promise<CronJobStats>, jobName: string) => async () => {
    try {
      const startTime = Date.now();
      const stats = await fn();
      const duration = Date.now() - startTime;

      console.log(`✅ ${jobName} completed in ${duration}ms`);
      console.log(`📊 Stats: ${JSON.stringify(stats, null, 2)}`);

      if (stats.errors.length > 0) {
        console.warn(`⚠️ ${jobName} had ${stats.errors.length} errors:`, stats.errors);
      }
    } catch (error) {
      console.error(`❌ Fatal error in ${jobName}:`, error);
    }
  };

const startCronJobs = () => {
  console.log('🚀 Starting Attack Simulation Cron Jobs...');

  cron.schedule(
    '*/15 * * * *',
    withErrorHandling(processScheduledSimulations, 'Scheduled Simulations Processor'),
    { name: 'processScheduledSimulations', timezone: 'UTC' }
  );

  cron.schedule(
    '*/30 * * * *',
    withErrorHandling(processCourseLifecycle, 'Course Lifecycle Processor'),
    { name: 'processCourseLifecycle', timezone: 'UTC' }
  );

  cron.schedule(
    '0 9 * * *',
    withErrorHandling(processAttackSimulationLaunches, 'Attack Simulation Launcher'),
    { name: 'processAttackSimulationLaunches', timezone: 'UTC' }
  );

  console.log('✨ Cron jobs started successfully!');
  console.log('📅 Schedules:');
  console.log('  - Scheduled Simulations: Every 15 minutes');
  console.log('  - Course Lifecycle: Every 30 minutes');
  console.log('  - Attack Simulations: Daily at 9:00 AM UTC');
};

const manualTriggers = {
  processScheduledSimulations,
  processCourseLifecycle,
  processAttackSimulationLaunches,
  launchGoPhishCampaign,
  getCronJobStatus: () => {
    const tasks = cron.getTasks();
    return Array.from(tasks.entries()).map(([name, task]) => ({
      name,
      exists: !!task,
    }));
  },
};

export {
  startCronJobs,
  launchGoPhishCampaign,
  manualTriggers,
  type CronJobStats,
}; 



/* 

It's designed to manage the lifecycle of cybersecurity training courses and automatically launch phishing simulation attacks.
Overall Purpose
This system automates a cybersecurity training workflow where:

Users are enrolled in training courses with specific schedules
Courses activate and expire automatically based on dates
After courses expire, phishing simulations are launched to test what users learned

The Three Main Cron Jobs
1. Scheduled Simulations Processor (Every 15 minutes)
typescriptprocessScheduledSimulations()
What it does:

Looks for training campaigns that are scheduled to start "later" but whose start time has now arrived
Updates the campaign status from "Schedule Later" to "Deliver Immediately"
Activates the first courses for all users in that campaign
Makes courses visible to users so they can start learning

Example scenario:

Admin schedules a "Phishing Awareness Campaign" to start on Monday at 9 AM
This job checks every 15 minutes and when Monday 9 AM arrives, it automatically starts the campaign for all enrolled users

2. Course Lifecycle Processor (Every 30 minutes)
typescriptprocessCourseLifecycle()
What it does:

Activates pending courses whose launch date has arrived
Expires active courses whose expiry date has passed
Sequences courses - when one course expires, automatically activates the next course in the training sequence

Example scenario:

User has a 3-course sequence: "Basic Security" → "Email Security" → "Advanced Threats"
Each course runs for 1 week
When "Basic Security" expires, "Email Security" automatically becomes active
When "Email Security" expires, "Advanced Threats" automatically becomes active

3. Attack Simulation Launcher (Daily at 9:00 AM UTC)
typescriptprocessAttackSimulationLaunches()
What it does:

Finds courses that expired exactly yesterday
Launches actual phishing simulation attacks via GoPhish (a phishing simulation platform)
Tests whether users can apply what they learned in the training

Example scenario:

User completes "Phishing Awareness Training" on Friday
On Saturday morning, the system automatically sends them a simulated phishing email to test if they can identify it as suspicious

Key Workflow Example
Here's how a complete training cycle works:

Day 0: Admin schedules "Cybersecurity Bootcamp" for 100 employees starting Monday
Monday 9 AM: Cron job #1 activates the first course "Email Security Basics" for all users
Monday-Sunday: Users complete the training course
Sunday 11:59 PM: Course expires, Cron job #2 marks it as expired and activates the next course
Monday 9 AM: Cron job #3 launches a simulated phishing attack to test what users learned
Repeat: Process continues through the entire training sequence

Technical Details
Database Models Involved:

ScheduleAttackSimulation: Campaign scheduling and metadata
UserCourse: Individual user enrollments with dates and status
Course: Training content and associated attack simulations
AttackSimulation: Phishing simulation templates and configurations

Status Flow:
PENDING → ACTIVE → EXPIRED → (Attack Simulation Launched) → COMPLETED
Integration with GoPhish:

When launching attacks, it calls the GoPhish API
Creates campaigns with email templates, landing pages, and target groups
Tracks which simulations were launched for each course

Benefits of This System:

Automation: No manual intervention needed once campaigns are scheduled
Scalability: Can handle hundreds/thousands of users automatically
Sequencing: Ensures proper learning progression through course series
Testing: Validates learning through real-world simulation attacks
Compliance: Provides audit trail of who completed training and when
Effectiveness: Tests if security training actually changes user behavior

This is essentially a complete automated cybersecurity awareness training and testing pipeline!

*/