import rateLimit from 'express-rate-limit';

/**
 * Generic rate limiter — can be customized per route
 */
export const createRateLimiter = (
  windowMs: number,
  max: number,
  message?: string
) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Example predefined limiters
export const loginRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many login attempts'
);

export const refreshRateLimiter = createRateLimiter(60 * 60 * 1000, 20); // 1 hour

export const companyLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests for this action'
); // 15 minutes

export const groupLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests for this action'
);

export const userLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests for this action'
);

export const otpLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests
  'Too many OTP requests'
);

// middleware/rateLimiters.ts
export const courseLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests
  'Too many Course  requests'
);

export const groupBundleLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests
  'Too many GroupBundle requests'
);

export const bundleLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests
  'Too many Bundle requests'
);

export const userCourseLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests
  'Too many UserCourse requests'
);

export const courseLessonProgressLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests
  'Too many CourseLessonProgress requests'
);

export const assignmentLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests
  'Too many Assignment requests'
);

export const lessonLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests
  'Too many Lesson requests'
);

export const discountLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests
  'Too many Discount requests'
);

export const bundlePurchaseLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests
  'Too many BundlePurchase requests'
);

export const scheduleAttackSimulationLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests
  'Too many ScheduleAttackSimulation requests'
);
