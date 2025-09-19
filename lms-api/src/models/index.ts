import sequelize from '../config/database';
import User from './users/users';
import Group from './groups/groups';
import GroupUser from './groupUsers/groupUsers';
import Company from './companies/companies';
import OTP from './otps/otps';
import Token from './tokens/tokens';
import Course from './courses/courses';
import Lesson from './lessons/lessons';
import Assignment from './assignments/assignments';
import CourseLessonProgress from './courseLessonProgresses/courseLessonProgresses';
import UserCourse from './userCourses/userCourses';
import Bundle from './bundles/bundles';
import BundleCourse from './bundleCourses/bundleCourses';
import BundlePurchase from './bundlePurchases/bundlePurchases';
import GroupBundle from './groupBundles/groupBundles';
import AttackSimulation from './attackSimulations/attackSimulations';
import Discount from './discounts/discounts'; // ← Add this import
import ScheduleAttackSimulation from './scheduleAttackSimulations/scheduleAttackSimulations';
import ScheduleEmail from './scheduleEmails/scheduleEmails';
import EmailTemplate from './emailTemplates/emailTemplates';
import ScheduleEmailRecipient from './scheduleEmailRecipientJunctionTable/scheduleEmailRecipientJunctionTable';

// Import all models
const models = {
  User,
  Group,
  GroupUser,
  Company,
  Token,
  OTP,
  Course,
  Lesson,
  Assignment,
  CourseLessonProgress,
  UserCourse,
  Bundle,
  BundleCourse,
  BundlePurchase,
  GroupBundle,
  AttackSimulation,
  Discount,
  ScheduleAttackSimulation,
  EmailTemplate,
  ScheduleEmail,
  ScheduleEmailRecipient

};

// Call the associate method on each model that has one
Object.keys(models).forEach((modelName) => {
  const model = models[modelName as keyof typeof models];
  if ('associate' in model && typeof model.associate === 'function') {
    model.associate(models);
  }
});

// Export models and sequelize instance
export {
  sequelize,
  User,
  Group,
  GroupUser,
  Company,
  Token,
  OTP,
  Course,
  Lesson,
  Assignment,
  CourseLessonProgress,
  UserCourse,
  Bundle,
  BundleCourse,
  BundlePurchase,
  GroupBundle,
  AttackSimulation,
  Discount,
  ScheduleAttackSimulation,
  EmailTemplate,
  ScheduleEmail,
  ScheduleEmailRecipient
};

export default models;