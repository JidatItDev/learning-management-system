import { ScheduleStatus } from '../../models/scheduleEmails/scheduleEmails';
import { IEmailTemplate, IUser } from '../../types/models';

export interface IScheduleEmail {
  id: string;
  templateId: string;
  customSubject: string;
  recipientIds?: string[] | null;
  status: ScheduleStatus;
  createdBy: string;
  scheduledAt: Date;
  createdAt: Date;
  updatedAt: Date;
  template?: IEmailTemplate;
  createdByUser?: IUser;
}

export interface CreateScheduleEmailDTO {
  templateId: string;
  customSubject: string;
  recipientIds?: string[] | null;
  status?: ScheduleStatus;
  createdBy: string;
  scheduledAt: Date;
}

export interface UpdateScheduleEmailDTO {
  customSubject?: string;
  recipientIds?: string[] | null;
  status?: ScheduleStatus;
  scheduledAt?: Date;
}

export interface ScheduleEmailQuery {
  page?: number;
  limit?: number;
  status?: ScheduleStatus;
  createdBy?: string;
}