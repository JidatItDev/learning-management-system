// Then, here's the optimized cron job that can use direct property access:

import cron from 'node-cron';
import { scheduleEmailService } from '../services/scheduleEmailService/scheduleEmailService';
import { emailService } from '../utils/emailService';
import { parseTemplate, resolveSubject } from '../utils/emailTemplateParser';
import { AppError } from '../middleware/errorHandler';
import { ScheduleStatus } from '../models/scheduleEmails/scheduleEmails';

async function runScheduledEmailCronJob(): Promise<void> {
  try {
    console.log('🔄 Starting scheduled email cron job...');
    const now = new Date();
    const schedules = await scheduleEmailService.getPendingScheduleEmails(now);

    console.log(`📧 Found ${schedules.length} pending scheduled emails`);

    for (const schedule of schedules) {
      try {
        console.log(`📧 Processing scheduled email: ${schedule.id}`);

        // Access template directly (included in the service query)
        const template = schedule.template;
        if (!template || !template.isActive) {
          console.error(`❌ Template not found or inactive for schedule: ${schedule.id}`);
          await schedule.update({ status: ScheduleStatus.FAILED });
          continue;
        }

        // Access recipients directly (included in the service query)
        const recipients = schedule.recipientUsers || [];
        
        if (recipients.length === 0) {
          console.error(`❌ No recipients found for schedule: ${schedule.id}`);
          await schedule.update({ status: ScheduleStatus.FAILED });
          continue;
        }

        // Filter only active recipients
        const activeRecipients = recipients.filter((recipient: any) => recipient.isActive);
        
        if (activeRecipients.length === 0) {
          console.error(`❌ No active recipients found for schedule: ${schedule.id}`);
          await schedule.update({ status: ScheduleStatus.FAILED });
          continue;
        }

        console.log(`📧 Sending to ${activeRecipients.length} active recipients`);

        // Resolve the subject (custom or template)
        const subject = resolveSubject(
          template.subject,
          schedule.customSubject || undefined
        );

        // Send emails to each recipient
        let successCount = 0;
        let failureCount = 0;

        for (const recipient of activeRecipients) {
          try {
            // Create template parameters for this recipient
            const params = {
              firstName: recipient.firstName || 'User',
              lastName: recipient.lastName || '',
              email: recipient.email,
              // Common placeholder values - you can customize these based on your needs
              module_name: 'Cybersecurity Training',
              otp: '123456', // This would typically be generated dynamically
              campaign_name: 'Annual Cybersecurity Campaign',
              group_name: 'Default Group',
              manager_email: 'manager@example.com',
              manager_name: 'Manager Name',
              completion_rate: '85%',
              active_users: '150',
              modules_completed: '45',
            };

            // Parse template placeholders
            const parsedSubject = parseTemplate(subject, params);
            const parsedBody = parseTemplate(template.body, params);

            // Send the email
            await emailService.sendEmail(
              recipient.email,
              parsedSubject,
              parsedBody
            );

            console.log(`✅ Email sent successfully to: ${recipient.email}`);
            successCount++;

          } catch (emailError) {
            console.error(`❌ Failed to send email to ${recipient.email}:`, emailError);
            failureCount++;
          }
        }

        // Update schedule status based on results
        if (successCount > 0 && failureCount === 0) {
          await schedule.update({ status: ScheduleStatus.SENT });
          console.log(`✅ All emails sent successfully for schedule: ${schedule.id}`);
        } else if (successCount > 0 && failureCount > 0) {
          // Partial success - you might want to create a new status for this
          await schedule.update({ status: ScheduleStatus.SENT });
          console.log(`⚠️ Partially sent for schedule: ${schedule.id} (${successCount} success, ${failureCount} failed)`);
        } else {
          await schedule.update({ status: ScheduleStatus.FAILED });
          console.log(`❌ All emails failed for schedule: ${schedule.id}`);
        }

      } catch (error) {
        console.error(`❌ Failed to process scheduled email ${schedule.id}:`, error);
        await schedule.update({ status: ScheduleStatus.FAILED });
      }
    }

    console.log('✅ Scheduled email cron job completed');

  } catch (error) {
    console.error('❌ Scheduled email cron error:', error);
  }
}

// Error handling wrapper
const withErrorHandling = (fn: () => Promise<void>) => async () => {
  try {
    await fn();
  } catch (error) {
    console.error(`❌ Fatal error in cron job: ${fn.name}`, error);
  }
};

// Manual trigger function for testing/admin purposes
export async function manualTriggerScheduledEmails(): Promise<{
  processed: number;
  success: number;
  failed: number;
}> {
  try {
    console.log('🔧 Manual trigger: Processing scheduled emails...');
    
    const now = new Date();
    const schedules = await scheduleEmailService.getPendingScheduleEmails(now);
    
    let successCount = 0;
    let failedCount = 0;

    for (const schedule of schedules) {
      try {
        // Process each schedule similar to the cron job
        const template = schedule.template;
        if (!template || !template.isActive) {
          await schedule.update({ status: ScheduleStatus.FAILED });
          failedCount++;
          continue;
        }

        const recipients = schedule.recipientUsers || [];
        const activeRecipients = recipients.filter((r: any) => r.isActive);
        
        if (activeRecipients.length === 0) {
          await schedule.update({ status: ScheduleStatus.FAILED });
          failedCount++;
          continue;
        }

        const subject = resolveSubject(template.subject, schedule.customSubject || undefined);
        
        for (const recipient of activeRecipients) {
          const params = {
            firstName: recipient.firstName || 'User',
            lastName: recipient.lastName || '',
            email: recipient.email,
            module_name: 'Cybersecurity Training',
            otp: '123456',
            campaign_name: 'Annual Cybersecurity Campaign',
            group_name: 'Default Group',
            manager_email: 'manager@example.com',
            manager_name: 'Manager Name',
            completion_rate: '85%',
            active_users: '150',
            modules_completed: '45',
          };

          const parsedSubject = parseTemplate(subject, params);
          const parsedBody = parseTemplate(template.body, params);

          await emailService.sendEmail(recipient.email, parsedSubject, parsedBody);
        }

        await schedule.update({ status: ScheduleStatus.SENT });
        successCount++;

      } catch (error) {
        console.error(`Failed to process schedule ${schedule.id}:`, error);
        await schedule.update({ status: ScheduleStatus.FAILED });
        failedCount++;
      }
    }

    return {
      processed: schedules.length,
      success: successCount,
      failed: failedCount,
    };

  } catch (error) {
    console.error('Manual trigger failed:', error);
    throw new AppError('Failed to manually trigger scheduled emails', 500);
  }
}

// Start the cron job (every 1 minute)
export function startScheduledEmailCronJob(): void {
  cron.schedule('*/1 * * * *', withErrorHandling(runScheduledEmailCronJob));
  console.log('✨ Scheduled email cron job started (every 1 minute)');
}

// Export the manual functions for admin routes
export const manualTriggers = {
  processScheduledEmails: manualTriggerScheduledEmails,
};

