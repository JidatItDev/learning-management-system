import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { applySecurity } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './config/logger';
import cors from 'cors';
import userRouter from './routes/v1/users/users';
import authRouter from './routes/v1/auth/auth';
import companyRoutes from './routes/v1/companies/companies';
import groupRouter from './routes/v1/groups/groups';
import otpRouter from './routes/v1/otps/otps';
import courseRouter from './routes/v1/courses/courses';
import lessonRouter from './routes/v1/lessons/lessons';
import userCourseRouter from './routes/v1/userCourses/userCourses';
import progressRouter from './routes/v1/courseLessonProgresses/courseLessonProgresses';
import bundleRouter from './routes/v1/bundles/bundles';
import discountRouter from './routes/v1/discounts/discounts';
import bundlePurchaseRouter from './routes/v1/bundlePurchases/bundlePurchases';
import groupBundleRouter from './routes/v1/groupBundles/groupBundles';
import attackSimulationRouter from './routes/v1/attackSimulations/attackSimulations';
import scheduleAttackSimulationRouter from './routes/v1/scheduleAttackSimulations/scheduleAttackSimulations';
import emailTemplateRouter from './routes/v1/emailTemplates/emailTemplates';
import scheduleEmailRouter from './routes/v1/scheduleEmails/scheduleEmails';
import { startCronJobs, manualTriggers } from './utils/attackSimulationCron';
import { registerCronJobs } from './utils/cronJobs';
import { startScheduledEmailCronJob, manualTriggers as emailManualTriggers } from './utils/scheduleEmailCron';
import cookieParser from 'cookie-parser';
import { EmailService } from './utils/emailService';
// ADD: Import the email test routes
import { createTestEmailRoutes } from './utils/manualEmailTest';

const app = express();

// Middleware setup
app.use(express.json());
app.use(cors());
app.use(applySecurity);
app.use(cookieParser());

app.get('/invitation-accepted', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Invitation accepted. Please initiate signup via POST /api/v1/users/microsoft-signup with your email and role.',
    nextStep: {
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/microsoft-signup',
      body: {
        role: 'subscriber',
        email: 'aqeel4622@outlook.com',
      },
    },
  });
});

// Routes setup
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/groups', groupRouter);
app.use('/api/v1/otps', otpRouter);
app.use('/api/v1/courses', courseRouter);
app.use('/api/v1/lessons', lessonRouter);
app.use('/api/v1/userCourses', userCourseRouter);
app.use('/api/v1/courseLessonProgresses', progressRouter);
app.use('/api/v1/bundles', bundleRouter);
app.use('/api/v1/discounts', discountRouter);
app.use('/api/v1/bundlePurchases', bundlePurchaseRouter);
app.use('/api/v1/groupBundles', groupBundleRouter);
app.use('/api/v1/attackSimulations', attackSimulationRouter);
app.use('/api/v1/scheduleAttackSimulations', scheduleAttackSimulationRouter);
app.use('/api/v1/emailTemplates', emailTemplateRouter);
app.use('/api/v1/scheduledEmails', scheduleEmailRouter);

// ADD: Mount the email test routes
app.use('/api/v1/admin', createTestEmailRoutes());

// Admin routes for manual cron triggers (add authentication and admin check)
app.post('/api/v1/admin/manual-trigger/scheduled-simulations', async (req, res) => {
  const stats = await manualTriggers.processScheduledSimulations();
  res.json({ success: true, stats });
});

app.post('/api/v1/admin/manual-trigger/course-lifecycle', async (req, res) => {
  const stats = await manualTriggers.processCourseLifecycle();
  res.json({ success: true, stats });
});

app.post('/api/v1/admin/manual-trigger/attack-launches', async (req, res) => {
  const stats = await manualTriggers.processAttackSimulationLaunches();
  res.json({ success: true, stats });
});

// NEW: Admin route for manual scheduled email triggers
app.post('/api/v1/admin/manual-trigger/scheduled-emails', async (req, res) => {
  try {
    const stats = await emailManualTriggers.processScheduledEmails();
    res.json({ 
      success: true, 
      message: 'Scheduled emails processed successfully',
      stats 
    });
  } catch (error: any) {
    logger.error('Manual scheduled email trigger failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process scheduled emails',
      error: error.message 
    });
  }
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handling middleware should be LAST
app.use(errorHandler);

// Start cron jobs
startCronJobs();
registerCronJobs();
startScheduledEmailCronJob();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

export default app;