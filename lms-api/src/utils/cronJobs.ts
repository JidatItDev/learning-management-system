import cron from 'node-cron';
import { authService } from '../services/authService/authService';

/**
 * Runs all scheduled cron jobs
 */
export function registerCronJobs() {
  // Every night at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      await authService.cleanupExpiredTokens();
      console.log('[CRON] Expired tokens cleaned at midnight');
    } catch (err) {
      console.error('[CRON] Error cleaning expired tokens:', err);
    }
  });
}
