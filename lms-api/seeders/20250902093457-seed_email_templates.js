'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('EmailTemplates', [
      {
        id: require('uuid').v4(),
        name: '20 days',
        type: 'Reminder',
        subject: 'Don’t Forget: Complete Your Cybersecurity Training!',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Complete Your Cybersecurity Training</h2>
              <p>Dear User,</p>
              <p>You have 20 days remaining to complete your assigned cybersecurity training. Stay proactive and keep your skills sharp!</p>
              <p><a href="https://lms2.jidatit.uk/courses" style="color: #007bff;">Access Your Training</a></p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: '19 days',
        type: 'Reminder',
        subject: 'Don’t Forget: Complete Your Cybersecurity Training!',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Reminder: Cybersecurity Training Due Soon</h2>
              <p>Dear User,</p>
              <p>You have 19 days left to complete your cybersecurity training. Don’t miss out—log in now to finish your modules!</p>
              <p><a href="https://lms2.jidatit.uk/courses" style="color: #007bff;">Access Your Training</a></p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: '18 days',
        type: 'Reminder',
        subject: 'Don’t Forget: Complete Your Cybersecurity Training!',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>18 Days to Go: Complete Your Training</h2>
              <p>Dear User,</p>
              <p>Your cybersecurity training is due in 18 days. Stay on track and complete your modules today!</p>
              <p><a href="https://lms2.jidatit.uk/courses" style="color: #007bff;">Access Your Training</a></p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: '14 days',
        type: 'Reminder',
        subject: 'Don’t Forget: Complete Your Cybersecurity Training!',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Two Weeks Left: Cybersecurity Training Reminder</h2>
              <p>Dear User,</p>
              <p>You have 14 days remaining to complete your cybersecurity training. Log in now to stay compliant!</p>
              <p><a href="https://lms2.jidatit.uk/courses" style="color: #007bff;">Access Your Training</a></p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: '7 days',
        type: 'Reminder',
        subject: 'Don’t Forget: Complete Your Cybersecurity Training!',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Final Week: Complete Your Cybersecurity Training</h2>
              <p>Dear User,</p>
              <p>Only 7 days remain to complete your cybersecurity training. Act now to avoid missing the deadline!</p>
              <p><a href="https://lms2.jidatit.uk/courses" style="color: #007bff;">Access Your Training</a></p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: 'Training Module Completion',
        type: 'Training',
        subject: 'Congratulations! You’ve Completed [module_name]',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Congratulations on Your Achievement!</h2>
              <p>Dear User,</p>
              <p>You’ve successfully completed the [module_name] module. Great job on advancing your cybersecurity skills!</p>
              <p>View your progress or start your next module at <a href="https://lms2.jidatit.uk/courses" style="color: #007bff;">LMS Dashboard</a>.</p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: 'Training module assignment',
        type: 'Training',
        subject: 'New Training Assignment: [module_name]',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>New Training Assignment</h2>
              <p>Dear User,</p>
              <p>A new training module, [module_name], has been assigned to you. Please complete it by the due date to stay compliant.</p>
              <p>Start now at <a href="https://lms2.jidatit.uk/courses" style="color: #007bff;">LMS Dashboard</a>.</p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: 'Campaign Monthly Report',
        type: 'Report',
        subject: 'Campaign Monthly Report',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Your Monthly Campaign Report</h2>
              <p>Dear User,</p>
              <p>Here’s your monthly report for the ongoing cybersecurity campaign. Review key metrics and progress below:</p>
              <ul>
                <li>Completion Rate: [completion_rate]</li>
                <li>Active Users: [active_users]</li>
                <li>Modules Completed: [modules_completed]</li>
              </ul>
              <p>Access the full report at <a href="https://lms2.jidatit.uk/reports" style="color: #007bff;">LMS Reports</a>.</p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: 'Cyber Campaign Launched',
        type: 'Campaign',
        subject: 'Cyber Awareness Campaign Launched: [campaign_name]',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>New Campaign Launched: [campaign_name]</h2>
              <p>Dear User,</p>
              <p>We’re excited to announce the launch of the [campaign_name] cybersecurity awareness campaign! Participate to enhance your skills and stay secure.</p>
              <p>Join now at <a href="https://lms2.jidatit.uk/campaigns" style="color: #007bff;">LMS Campaigns</a>.</p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: 'Annual License Renewal',
        type: 'Reminder',
        subject: 'Annual License Renewal Reminder',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Renew Your LMS License</h2>
              <p>Dear User,</p>
              <p>Your annual LMS license is due for renewal. Ensure uninterrupted access by renewing today.</p>
              <p>Renew now at <a href="https://lms2.jidatit.uk/account" style="color: #007bff;">LMS Account</a>.</p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: 'Password Reset',
        type: 'Password',
        subject: 'Your Password Reset Code: {otp}',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Password Reset Request</h2>
              <p>Dear User,</p>
              <p>You requested a password reset. Use the following OTP to reset your password:</p>
              <p><strong>OTP: {otp}</strong></p>
              <p>This code is valid for 15 minutes. Reset your password at <a href="https://lms2.jidatit.uk/reset-password" style="color: #007bff;">Reset Password</a>.</p>
              <p>If you did not request this, please contact support.</p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: 'Group Deactivation/Deletion',
        type: 'Alert',
        subject: 'A group is deactivated or deleted',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Group Status Update</h2>
              <p>Dear User,</p>
              <p>The group [group_name] has been deactivated or deleted. Please contact your administrator for more details.</p>
              <p>Manage your groups at <a href="https://lms2.jidatit.uk/groups" style="color: #007bff;">LMS Groups</a>.</p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: 'Account Deactivation/Deletion',
        type: 'Notification',
        subject: 'A manager account is deactivated or deleted',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Account Status Update</h2>
              <p>Dear User,</p>
              <p>The manager account for [manager_email] has been deactivated or deleted. Please contact support if you have questions.</p>
              <p>Manage your account at <a href="https://lms2.jidatit.uk/account" style="color: #007bff;">LMS Account</a>.</p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: 'New Group Created',
        type: 'Notification',
        subject: 'A new Group has been created',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>New Group Created</h2>
              <p>Dear User,</p>
              <p>A new group, [group_name], has been created. You’ve been added as a member. Explore the group’s resources now!</p>
              <p>View details at <a href="https://lms2.jidatit.uk/groups" style="color: #007bff;">LMS Groups</a>.</p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: 'New Manager Registration Onboarding',
        type: 'Onboarding',
        subject: 'Welcome to Haxia Partnership Program',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Welcome to the Haxia Partnership Program!</h2>
              <p>Dear [manager_name],</p>
              <p>We’re thrilled to welcome you as a manager in the Haxia Partnership Program. Get started by setting up your account and exploring your dashboard.</p>
              <p>Log in at <a href="https://lms2.jidatit.uk/login" style="color: #007bff;">LMS Login</a>.</p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: require('uuid').v4(),
        name: 'A New Manager Registration',
        type: 'Registration',
        subject: 'A New Manager Registration',
        body: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>New Manager Registration</h2>
              <p>Dear Admin,</p>
              <p>A new manager, [manager_name], has registered with email [manager_email]. Please review their account details and approve as needed.</p>
              <p>Manage accounts at <a href="https://lms2.jidatit.uk/admin/users" style="color: #007bff;">LMS Admin Dashboard</a>.</p>
              <p>Best regards,<br>The LMS Team</p>
            </body>
          </html>
        `,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('EmailTemplates', null, {});
  },
};