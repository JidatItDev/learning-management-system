import { body, query, param, ValidationChain } from 'express-validator';
import { LaunchStatus, Status } from '../models/scheduleAttackSimulations/scheduleAttackSimulations';
import { BundleType } from '../models/bundles/bundles';
import moment from 'moment-timezone';

export const getAllScheduleAttackSimulationsValidation: ValidationChain[] = [
  query('groupIds')
    .optional()
    .isArray()
    .withMessage('groupIds must be an array')
    .custom((value) => {
      if (value && value.some((id: string) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        throw new Error('All groupIds must be valid UUIDs');
      }
      return true;
    }),
  query('bundleId')
    .optional()
    .isUUID()
    .withMessage('Invalid bundle ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
];

export const getScheduleAttackSimulationByIdValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid schedule attack simulation ID'),
];

export const createScheduleAttackSimulationValidation: ValidationChain[] = [
  body('name')
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name is required and must be between 1 and 255 characters'),
  body('groupIds')
    .optional()
    .isArray()
    .withMessage('groupIds must be an array')
    .custom((value) => {
      if (value && value.some((id: string) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        throw new Error('All groupIds must be valid UUIDs');
      }
      return true;
    }),
  body('userIds')
    .optional()
    .isArray()
    .withMessage('userIds must be an array')
    .custom((value) => {
      if (value && value.some((id: string) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        throw new Error('All userIds must be valid UUIDs');
      }
      return true;
    }),
  body('bundleId').isUUID().withMessage('Invalid bundle ID'),
  body('campaignType')
    .isIn(['Simulated Phishing & Security Awareness Training', 'Advance Training'])
    .withMessage('Invalid campaign type'),
  body('launchDate')
    .optional()
    .custom((value, { req }) => {
      if (req.body.launchStatus === LaunchStatus.SCHEDULE_LATER) {
        if (!value) {
          throw new Error('launchDate is required for Schedule Later');
        }
        // Validate YYYY-MM-DD format
        if (!moment(value, 'YYYY-MM-DD', true).isValid()) {
          throw new Error('launchDate must be in YYYY-MM-DD format');
        }
        // Check if date is in the future
        const launchDate = moment(value, 'YYYY-MM-DD');
        if (launchDate.isSameOrBefore(moment(), 'day')) {
          throw new Error('launchDate must be in the future for Schedule Later');
        }
      }
      return true;
    }),
  body('launchTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('launchTime must be in HH:MM format')
    .custom((value, { req }) => {
      if (req.body.launchStatus === LaunchStatus.SCHEDULE_LATER && !value) {
        throw new Error('launchTime is required for Schedule Later');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['draft', 'scheduled', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('launchStatus')
    .isIn(['Deliver Immediately', 'Schedule Later'])
    .withMessage('Invalid launch status'),
  body('timezone')
    .custom((value) => {
      // Validate timezone using moment-timezone
      if (!moment.tz.zone(value)) {
        throw new Error('Invalid timezone');
      }
      return true;
    })
    .withMessage('Invalid timezone'),
  body('courseIds')
    .isArray({ min: 1 })
    .withMessage('courseIds must be a non-empty array')
    .custom((value) => {
      if (value && value.some((id: string) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        throw new Error('All courseIds must be valid UUIDs');
      }
      return true;
    }),
  // Custom validation to ensure either groupIds or userIds is provided
  body().custom((value) => {
    if (!value.groupIds?.length && !value.userIds?.length) {
      throw new Error('Either groupIds or userIds must be provided');
    }
    return true;
  }),
];

export const updateScheduleAttackSimulationValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid schedule attack simulation ID'),
  body('name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('groupIds')
    .optional()
    .isArray()
    .withMessage('groupIds must be an array')
    .custom((value) => {
      if (value && value.some((id: string) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        throw new Error('All groupIds must be valid UUIDs');
      }
      return true;
    }),
  body('userIds')
    .optional()
    .isArray()
    .withMessage('userIds must be an array')
    .custom((value) => {
      if (value && value.some((id: string) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        throw new Error('All userIds must be valid UUIDs');
      }
      return true;
    }),
  body('bundleId')
    .optional()
    .isUUID()
    .withMessage('Invalid bundle ID'),
  body('campaignType')
    .optional()
    .isIn(['Simulated Phishing & Security Awareness Training', 'Advance Training'])
    .withMessage('Invalid campaign type'),
  body('launchDate')
    .optional()
    .custom((value, { req }) => {
      if (req.body.launchStatus === LaunchStatus.SCHEDULE_LATER) {
        if (!value) {
          throw new Error('launchDate is required for Schedule Later');
        }
        // Validate YYYY-MM-DD format
        if (!moment(value, 'YYYY-MM-DD', true).isValid()) {
          throw new Error('launchDate must be in YYYY-MM-DD format');
        }
        // Check if date is in the future
        const launchDate = moment(value, 'YYYY-MM-DD');
        if (launchDate.isSameOrBefore(moment(), 'day')) {
          throw new Error('launchDate must be in the future for Schedule Later');
        }
      }
      return true;
    }),
  body('launchTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('launchTime must be in HH:MM format')
    .custom((value, { req }) => {
      if (req.body.launchStatus === LaunchStatus.SCHEDULE_LATER && !value) {
        throw new Error('launchTime is required for Schedule Later');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['draft', 'scheduled', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('launchStatus')
    .optional()
    .isIn(['Deliver Immediately', 'Schedule Later'])
    .withMessage('Invalid launch status'),
  body('timezone')
    .optional()
    .custom((value) => {
      if (value && !moment.tz.zone(value)) {
        throw new Error('Invalid timezone');
      }
      return true;
    })
    .withMessage('Invalid timezone'),
  body('courseIds')
    .optional()
    .isArray({ min: 1 })
    .withMessage('courseIds must be a non-empty array')
    .custom((value) => {
      if (value && value.some((id: string) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        throw new Error('All courseIds must be valid UUIDs');
      }
      return true;
    }),
];

export const deleteScheduleAttackSimulationValidation: ValidationChain[] = [
  param('id').isUUID().withMessage('Invalid schedule attack simulation ID'),
];