import { BundleType } from '../../models/bundles/bundles';
import { Status, LaunchStatus } from '../../models/scheduleAttackSimulations/scheduleAttackSimulations';

export interface ScheduleAttackSimulationFilters {
  groupId?: string;
  bundleId?: string;
  status?: Status;
  launchStatus?: LaunchStatus;
  page?: number;
  limit?: number;
}

export interface CreateScheduleAttackSimulationData {
  name: string;
  groupIds: string[] | null;
  userIds?: string[] | null;
  bundleId: string;
  campaignType: BundleType;
  launchDate: string;
  launchTime: string;
  timezone: string;
  courseIds: string[];
  status?: Status;
  launchStatus?: LaunchStatus;
}

export interface UpdateScheduleAttackSimulationData {
  name?: string;
  groupIds?: string[] | null;
  userIds?: string[] | null;
  bundleId?: string;
  campaignType?: BundleType;
  launchDate?: string;
  launchTime?: string;
  timezone?: string;
  courseIds?: string[];
  status?: Status;
  launchStatus?: LaunchStatus;
}