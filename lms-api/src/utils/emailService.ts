import nodemailer from 'nodemailer';
import { AppError } from '../middleware/errorHandler';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // Fix: Properly parse boolean
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Add these for better debugging
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development',
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000, // 30 seconds
      socketTimeout: 60000, // 60 seconds
    });
  }

  async sendOTPEmail(
    to: string,
    otp: string,
    purpose: 'verify' | 'reset',
    password?: string
  ) {
    try {
      await this.transporter.verify();

      const subject =
        purpose === 'verify' ? 'Verify Your Account' : 'Password Reset Request';
      const html = `
        <h2>${subject}</h2>
        <p>Your one-time password (OTP) is: <strong>${otp}</strong></p>
        ${password ? `<p>Your generated password is: <strong>${password}</strong></p>` : ''}
        <p>This OTP is valid for 10 minutes.</p>
        <p>Please use the OTP and ${password ? 'password' : 'your credentials'} to log in.</p>
        <p>If you did not request this, please ignore this email.</p>
      `;

      const mailOptions = {
        from: `"LMS System" <${process.env.SMTP_FROM}>`,
        to,
        subject,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      return result;
    } catch (error: any) {
      throw new AppError(`Failed to send OTP email: ${error.message}`, 500);
    }
  }

  /**
   * ADDED: Generic email sending method for Microsoft invitations and other custom emails
   */
  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    from?: string
  ) {
    try {
      console.log(`📧 Attempting to send email to: ${to}`);
      console.log(`📧 Subject: ${subject}`);

      console.log(`📧 Attempting to send email to: ${to}`);
      console.log(`📧 Using SMTP host: ${process.env.SMTP_HOST}`);

      // Test connection first
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('SMTP connection test failed');
      }

      // Verify transporter connection
      await this.transporter.verify();
      console.log('📧 SMTP connection verified');

      const mailOptions = {
        from: from || `"LMS System" <${process.env.SMTP_FROM}>`,
        to,
        subject,
        html: htmlContent,
      };

      console.log('📧 Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        htmlLength: htmlContent.length,
      });

      const result = await this.transporter.sendMail(mailOptions);

      console.log('📧 Email sent successfully:', {
        messageId: result.messageId,
        response: result.response,
      });

      return result;
    } catch (error: any) {
      console.error('📧 Email sending failed:', {
        error: error.message,
        code: error.code,
        command: error.command,
      });
      throw new AppError(`Failed to send email: ${error.message}`, 500);
    }
  }

  // EmailService.ts - Update the sendMicrosoftInvitationEmail method

  /**
   * UPDATED: Send Microsoft invitation email with Microsoft OAuth URL directly
   */
  async sendMicrosoftInvitationEmail(
    to: string,
    firstName: string,
    microsoftOAuthUrl: string, // CHANGED: Now expects the full Microsoft OAuth URL
    organizationName: string = 'our organization'
  ) {
    try {
      const subject =
        'Microsoft Entra ID Invitation - Complete Your Registration';

      const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #0078d4; margin: 0; font-size: 24px;">Microsoft Entra ID Invitation</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; border: 1px solid #e1e5e9;">
          <h2 style="color: #333; margin-top: 0;">Hello ${firstName},</h2>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            You have been invited to join <strong>${organizationName}</strong> using Microsoft Entra ID authentication.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 25px;">
            To complete your registration, please click the button below. You will be securely redirected to Microsoft's login page:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${microsoftOAuthUrl}" 
               style="background-color: #0078d4; 
                      color: white; 
                      padding: 14px 28px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      display: inline-block; 
                      font-weight: bold; 
                      font-size: 16px;
                      box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              🚀 Complete Registration with Microsoft
            </a>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #2196f3;">
            <p style="margin: 0; font-size: 14px; color: #1565c0;">
              <strong>🔒 What happens next?</strong>
            </p>
            <ol style="color: #1565c0; font-size: 14px; margin: 10px 0 0 0; padding-left: 20px;">
              <li>Click the button above to go to Microsoft's secure login page</li>
              <li>Sign in with your Microsoft account (Outlook, Hotmail, or work account)</li>
              <li>Grant permission to access your basic profile information</li>
              <li>You'll be automatically logged into our system</li>
            </ol>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>Having trouble with the button?</strong><br>
              Copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; color: #0078d4; margin: 10px 0 0 0; font-size: 11px; font-family: monospace; background: #f5f5f5; padding: 8px; border-radius: 3px;">
              ${microsoftOAuthUrl}
            </p>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; font-size: 14px; margin: 0;">
              ⏰ <strong>Important:</strong> This invitation link will expire in 1 hour for security reasons.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; color: #999; font-size: 12px;">
          <p style="margin: 0;">
            If you did not expect this invitation, please ignore this email or contact support.
          </p>
          <p style="margin: 10px 0 0 0;">
            This is an automated message from ${organizationName}.
          </p>
        </div>
      </body>
      </html>
    `;

      console.log('📧 Sending Microsoft invitation email with OAuth URL:', {
        to,
        firstName,
        oAuthUrlPreview: microsoftOAuthUrl.substring(0, 100) + '...',
        organizationName,
      });

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      console.error('Failed to send Microsoft invitation email:', error);
      throw error;
    }
  }

  /**
   * ADDED: Test email connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('📧 Email service connection test: SUCCESS');
      return true;
    } catch (error: any) {
      console.error('📧 Email service connection test: FAILED', error.message);
      return false;
    }
  }
}

export const emailService = new EmailService();
