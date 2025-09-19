import { AppError } from '../../middleware/errorHandler';
import sequelize from '../../config/database';
import { Transaction } from 'sequelize'; // Import Transaction from sequelize module

import { Op } from 'sequelize';
import { emailService } from '../../utils/emailService';
import OTP from '../../models/otps/otps';

export class OTPService {
  /**
   * Generate and send OTP for a user
   */
  async generateAndSendOTP(
    userId: string,
    email: string,
    purpose: 'verify' | 'reset',
    password?: string,
    transaction?: Transaction // Accept optional transaction
  ) {
    const t = transaction || await sequelize.transaction();
    try {
      // Invalidate existing OTPs for the user
      await OTP.destroy({
        where: { userId },
        transaction: t,
      });

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Store OTP with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          await OTP.create(
            {
              userId,
              otp,
              expiresAt,
            },
            { transaction: t }
          );
          break; // Success, exit loop
        } catch (error: any) {
          attempts++;
          if (error.name === 'SequelizeDatabaseError' && error.original?.code === 'ER_LOCK_WAIT_TIMEOUT') {
            if (attempts === maxAttempts) {
              throw new AppError('Failed to store OTP due to persistent lock timeout', 500);
            }
            console.warn(`Lock timeout on OTP insert, retrying (${attempts}/${maxAttempts})...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          } else {
            throw error; // Rethrow non-lock errors
          }
        }
      }

      // Send OTP via email
      await emailService.sendOTPEmail(email, otp, purpose, password);

      if (!transaction) {
        await t.commit();
      }
      return { message: `OTP sent to ${email}` };
    } catch (error: any) {
      if (!transaction) {
        await t.rollback();
      }
      console.error(`Failed to generate and send OTP for ${email}:`, error);
      throw new AppError(`Failed to generate OTP: ${error.message}`, 500);
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(userId: string, otp: string, transaction?: Transaction) {
    const t = transaction || await sequelize.transaction();
    try {
      const otpRecord = await OTP.findOne({
        where: {
          userId,
          otp,
          expiresAt: { [Op.gt]: new Date() },
        },
        transaction: t,
      });

      if (!otpRecord) {
        throw new AppError('Invalid or expired OTP', 400);
      }

      // Delete OTP after successful verification
      await otpRecord.destroy({ transaction: t });

      if (!transaction) {
        await t.commit();
      }
      return { message: 'OTP verified successfully' };
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to verify OTP', 500);
    }
  }
}

export const otpService = new OTPService();