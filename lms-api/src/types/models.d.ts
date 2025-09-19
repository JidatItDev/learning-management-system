import { Model } from 'sequelize';
import { Status } from '../models/scheduleAttackSimulations/scheduleAttackSimulations';
import { Bundle } from '../models';
import { BundleType } from '../models/bundles/bundles';
import { ScheduleStatus } from '../models/scheduleEmails/scheduleEmails';

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'contributor' | 'groupLeader' | 'subscriber' | 'admin';
  isActive: boolean;
  signInType: 'withPassword' | 'passwordless' | 'microsoftEntraID';
  createdAt: Date;
  updatedAt: Date;
  update: (attributes: Partial<IUser>, options?: any) => Promise<IUser>;
}

export interface IToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompany {
  id: string;
  name: string;
  address?: string;
  vatNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroup extends Model {
  id: string;
  companyId: string;
  name: string;
  isActive: boolean;
  totalSeatsPurchasedPerBundle: number;
  totalSeatsAssigned: number;
  gophishGroupID?: string;
  signInType: 'withPassword' | 'passwordLess' | 'microsoftEntraID';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  getCompany: () => Promise<ICompany>;
  setCompany: (company: ICompany) => Promise<void>;
  getCreatedByUser: () => Promise<IUser>;
  setCreatedByUser: (user: IUser) => Promise<void>;
  getUsers: () => Promise<IUser[]>;
  addUser: (user: IUser, options?: { through?: any }) => Promise<void>;
  removeUser: (user: IUser) => Promise<void>;
  hasUser: (user: IUser) => Promise<boolean>;
  countUsers: () => Promise<number>;
  getGroupUsers: () => Promise<IGroupUser[]>;
  addGroupUser: (groupUser: IGroupUser) => Promise<void>;
  removeGroupUser: (groupUser: IGroupUser) => Promise<void>;
  hasGroupUser: (groupUser: IGroupUser) => Promise<boolean>;
  countGroupUsers: () => Promise<number>;
  getBundles: () => Promise<IBundle[]>;
  addBundle: (bundle: IBundle, options?: { through?: any }) => Promise<void>;
  removeBundle: (bundle: IBundle) => Promise<void>;
  hasBundle: (bundle: IBundle) => Promise<boolean>;
  countBundles: () => Promise<number>;
}

export interface IGroupUser extends Model {
  id: string;
  groupId: string;
  userId: string;
  role: 'groupLeader' | 'subscriber';
  createdAt: Date;
  updatedAt: Date;
  getUser: () => Promise<IUser>;
  setUser: (user: IUser) => Promise<void>;
  getGroup: () => Promise<IGroup>;
  setGroup: (group: IGroup) => Promise<void>;
}

export interface IOTP extends Model {
  id: string;
  userId: string;
  otp: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourse extends Model {
  id: string;
  title: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILesson extends Model {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  videoName: string;
  videoUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignment extends Model {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourseLessonProgress extends Model {
  id: string;
  userId: string;
  lessonId: string;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCourse extends Model {
  id: string;
  userId: string;
  courseId: string;
  visibility: boolean;
  scheduleAttackSimulationId?: string | null;
  launchDate?: Date | null;
  expiryDate?: Date | null;
  status?: CourseStatus;  
  createdAt: Date;
  updatedAt: Date;
}

export interface IBundle extends Model {
  id: string;
  title: string;
  description?: string;
  category: string;
  bundleType: BundleType;
  seatPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBundleCourse extends Model {
  id: string;
  bundleId: string;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBundlePurchase extends Model {
  id: string;
  bundleId: string;
  discountId?: string | null;
  seatsPurchased: number;
  totalPrice: number;
  purchasedBy: string;
  createdAt: Date;
  updatedAt: Date;
  getBundle: () => Promise<IBundle>;
  getDiscount: () => Promise<IDiscount | null>;
  getPurchasedByUser: () => Promise<IUser>;
  getGroupBundles: () => Promise<any[]>;
}

// export interface IGroupBundle extends Model {
//   id: string;
//   groupId: string;
//   bundlePurchaseId: string;
//   discountType: {
//     type: 'percentage' | 'seats';
//     value: number;
//     seatsThreshold?: number;
//   };
//   seatsAllocated: number;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface IGroupBundle extends Model {
//   id: string;
//   groupId: string;
//   bundleId: string;
//   seatsPurchased: number;
//   discountPercentage: number;
//   createdAt: Date;
//   updatedAt: Date;
//   getGroup: () => Promise<IGroup>;
//   setGroup: (group: IGroup) => Promise<void>;
//   getBundle: () => Promise<IBundle>;
//   setBundle: (bundle: IBundle) => Promise<void>;
// }

export interface IAttackSimulation extends Model {
  id: string;
  courseId: string;
  name: string;
  template: string;
  url: string;
  page: string;
  smtp: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  getCourse: () => Promise<ICourse>;
  setCourse: (course: ICourse) => Promise<void>;
  getCreatedByUser: () => Promise<IUser>;
  setCreatedByUser: (user: IUser) => Promise<void>;
}

export interface IDiscount extends Model {
  id: string;
  bundleIds?: string[] | null;
  percentage?: number | null;
  seats?: SeatsDiscount | null;
  expiryDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttackSimulationSchedule extends Model {
  id: string;
  name: string;
  campaignType: BundleType;
  groupIds: string[];
  userIds?: string[] | null;
  bundleId: string;
  launchDate: string;
  launchTime: string;
  status: Status;
  launchStatus: LaunchStatus;
  timezone: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  getGroup: () => Promise<IGroup>;
  setGroup: (group: IGroup) => Promise<void>;
  getBundle: () => Promise<IBundle>;
  setBundle: (bundle: IBundle) => Promise<void>;
  
  getCreatedByUser: () => Promise<IUser>;
  setCreatedByUser: (user: IUser) => Promise<void>;
}

export interface IEmailTemplate extends Model {
  id: string;
  name: string;
  type: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduleEmail extends Model {
  id: string;
  templateId: string;
  customSubject: string;
  status: ScheduleStatus;
  scheduledAt: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  getCreatedByUser: () => Promise<IUser>;
  setCreatedByUser: (user: IUser) => Promise<void>;
}