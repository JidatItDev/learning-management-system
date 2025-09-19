import { CourseStatus } from '../../models/userCourses/userCourses';

export interface CreateUserCourseData {
  userId: string;
  courseId: string;
  scheduleAttackSimulationId?: string | null;
  launchDate?: Date | null;
  expiryDate?: Date | null;
  status?: CourseStatus;
  visibility?: boolean;
}

export interface UpdateUserCourseData {
  launchDate?: Date | null;
  expiryDate?: Date | null;
  status?: CourseStatus;
  visibility?: boolean;
  attackSimulationId?: string | null;
}

export interface UserCourseFilters {
  userId?: string;
  courseId?: string;
  scheduleAttackSimulationId?: string;
  status?: CourseStatus;
  visibility?: boolean;
  page?: number;
  limit?: number;
}

export interface CourseLifecycleResult {
  action: LifecycleAction;
  userCourseId?: string;
  userId?: string;
  courseId?: string;
  scheduleId?: string;
  message?: string;
}

export enum LifecycleAction {
  ACTIVATED = 'activated',                    // Course became active
  EXPIRED = 'expired',                        // Course expired
  ACTIVATED_NEXT = 'activated_next',          // Next course in sequence activated
  ATTACK_SIMULATION_SCHEDULED = 'attack_simulation_scheduled', // Attack simulation was scheduled
  SCHEDULE_COMPLETED = 'schedule_completed',  // All courses in schedule completed
  NO_ACTION = 'no_action'                     // No action needed
}

export interface BulkCreateUserCourseData extends CreateUserCourseData {
  // Additional fields for bulk operations if needed
}

export interface CourseSequence {
  courseId: string;
  order: number;
  launchDate: Date;
  expiryDate: Date;
}

export interface ScheduleProgress {
  scheduleId: string;
  userId: string;
  totalCourses: number;
  completedCourses: number;
  activeCourse?: string;
  nextCourse?: string;
  isCompleted: boolean;
}