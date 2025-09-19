import Group from '../../models/groups/groups';
import User from '../../models/users/users';
import GroupUser from '../../models/groupUsers/groupUsers';
import { AppError } from '../../middleware/errorHandler';
import sequelize from '../../config/database';
import { groupService } from '../groupService/groupService';
import { userService } from '../userService';
import { UserRole } from '../../middleware/authenticator';
import { authService } from '../authService/authService';
import { AddGroupMemberData, CreateGroupMemberData, BulkCreateGroupMembersData, BulkAddGroupMembersData } from './groupUser.interface';
import { PasswordUtil } from '../../utils/passwordUtil';
import { otpService } from '../otpService/otpService';
import redis from '../../config/redis';
import { emailService } from '../../utils/emailService'; // ADDED: Import emailService

export class GroupUserService {
  async addGroupMember(
    groupId: string,
    data: AddGroupMemberData,
    requesterRole: UserRole
  ) {
    const transaction = await sequelize.transaction();
    try {
      if (!groupId || !data.userId || !data.role) {
        throw new AppError('Group ID, user ID, and role are required', 400);
      }

      const group = await Group.findByPk(groupId, { transaction });
      if (!group) {
        throw new AppError('Group not found', 404);
      }

      if (!group.isActive) {
        throw new AppError('Cannot add members to an inactive group', 400);
      }

      const user = await User.findByPk(data.userId, { transaction });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.isActive) {
        throw new AppError('Cannot add an inactive user to a group', 400);
      }

      if (
        requesterRole === UserRole.GROUP_LEADER &&
        data.role !== 'subscriber'
      ) {
        throw new AppError('GroupLeader can only add Subscribers', 403);
      }

      if (!['groupLeader', 'subscriber'].includes(data.role)) {
        throw new AppError('Invalid group role', 400);
      }

      // Verify user signInType matches group signInType
      if (user.signInType !== group.signInType) {
        throw new AppError('User signInType must match group signInType', 400);
      }

      const existingMembership = await GroupUser.findOne({
        where: { groupId, userId: data.userId },
        transaction,
      });
      if (existingMembership) {
        throw new AppError('User is already a member of this group', 409);
      }

      const groupUser = await GroupUser.create(
        {
          groupId,
          userId: data.userId,
          role: data.role,
        },
        { transaction }
      );

      await transaction.commit();
      return groupUser;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to add group member', 500);
    }
  }

  async bulkAddGroupMembers(
    data: BulkAddGroupMembersData,
    requesterRole: UserRole
  ) {
    const transaction = await sequelize.transaction();
    try {
      if (!data.groupId || !data.members || !Array.isArray(data.members) || data.members.length === 0) {
        throw new AppError('Group ID and non-empty members array are required', 400);
      }

      const group = await Group.findByPk(data.groupId, { transaction });
      if (!group) {
        throw new AppError('Group not found', 404);
      }

      if (!group.isActive) {
        throw new AppError('Cannot add members to an inactive group', 400);
      }

      const addedMembers: any[] = [];
      const errors: any[] = [];

      for (let i = 0; i < data.members.length; i++) {
        const memberData = data.members[i];
        try {
          if (!memberData.userId || !memberData.role) {
            throw new AppError('User ID and role are required', 400);
          }

          const user = await User.findByPk(memberData.userId, { transaction });
          if (!user) {
            throw new AppError('User not found', 404);
          }

          if (!user.isActive) {
            throw new AppError('Cannot add an inactive user to a group', 400);
          }

          if (requesterRole === UserRole.GROUP_LEADER && memberData.role !== 'subscriber') {
            throw new AppError('GroupLeader can only add Subscribers', 403);
          }

          if (!['groupLeader', 'subscriber'].includes(memberData.role)) {
            throw new AppError('Invalid group role', 400);
          }

          // Verify user signInType matches group signInType
          if (user.signInType !== group.signInType) {
            throw new AppError('User signInType must match group signInType', 400);
          }

          const existingMembership = await GroupUser.findOne({
            where: { groupId: data.groupId, userId: memberData.userId },
            transaction,
          });
          if (existingMembership) {
            throw new AppError('User is already a member of this group', 409);
          }

          const groupUser = await GroupUser.create(
            {
              groupId: data.groupId,
              userId: memberData.userId,
              role: memberData.role,
            },
            { transaction }
          );

          addedMembers.push({
            groupUser,
            message: 'User added to group successfully',
          });
        } catch (error) {
          errors.push({
            index: i,
            userId: memberData.userId,
            error: error instanceof AppError ? error.message : 'Unknown error',
          });
        }
      }

      await transaction.commit();
      return {
        added: addedMembers,
        errors,
      };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to bulk add group members', 500);
    }
  }

  async createGroupMember(
    data: CreateGroupMemberData,
    requesterRole: UserRole
  ) {
    const transaction = await sequelize.transaction();
    try {
      if (!data.groupId || !data.user) {
        throw new AppError('Group ID and user data are required', 400);
      }

      const { firstName, lastName, email, signInType, role } = data.user;

      if (!firstName || !lastName || !email || !signInType || !role) {
        throw new AppError(
          'User firstName, lastName, email, signInType, and role are required',
          400
        );
      }

      const group = await Group.findByPk(data.groupId, { transaction });
      if (!group) {
        throw new AppError('Group not found', 404);
      }

      if (!group.isActive) {
        throw new AppError('Cannot add members to an inactive group', 400);
      }

      if (requesterRole === UserRole.GROUP_LEADER && role !== 'subscriber') {
        throw new AppError('GroupLeader can only create Subscribers', 403);
      }

      if (!['groupLeader', 'subscriber'].includes(role)) {
        throw new AppError('Invalid group role', 400);
      }

      // Verify signInType matches group signInType
      if (signInType !== group.signInType) {
        throw new AppError('User signInType must match group signInType', 400);
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({
        where: { email: normalizedEmail },
        transaction,
      });
      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      // Validate signInType specific requirements
      if (signInType === 'microsoftEntraID' && data.user.password) {
        throw new AppError(
          'Password is not allowed for microsoftEntraID signInType',
          400
        );
      }

      const userData: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        role,
        signInType,
        isActive: signInType !== 'microsoftEntraID', // Microsoft users start inactive
      };

      let generatedPassword: string | undefined;

      // Handle different signInTypes
      if (signInType === 'withPassword') {
        generatedPassword = PasswordUtil.generateSecurePassword();
        userData.password = await authService.hashPassword(generatedPassword);
      } else if (signInType === 'microsoftEntraID') {
        // Set invitation status for Microsoft users
        userData.invitationStatus = 'pending';
        userData.isActive = false; // Start inactive until invitation accepted
      } else if (signInType === 'passwordless') {
        // Passwordless users are active but have no password
        userData.isActive = true;
      }

      const user = await User.create(userData, { transaction });

      const groupUser = await GroupUser.create(
        {
          groupId: data.groupId,
          userId: user.id,
          role,
        },
        { transaction }
      );

      let responseMessage = 'User created and added to group successfully';
      let microsoftSignup: any = null;

      // UPDATED: Handle post-creation actions based on signInType with proper email sending
      if (signInType === 'withPassword' && generatedPassword) {
        await otpService.generateAndSendOTP(user.id, user.email, 'verify', generatedPassword, transaction);
        responseMessage = 'User created and added to group successfully, OTP and password sent to email';
      } else if (signInType === 'microsoftEntraID') {
        // UPDATED: Handle Microsoft signup initiation with proper email sending
        try {
          console.log('🔧 Initiating Microsoft signup for group member:', user.email);
          
          // Generate state and store it in Redis (consistent with userController)
          const state = this.generateSecureRandomString();
          console.log('🔧 Generated state for group member:', state);
          
          // Store signup data in Redis
          const stateData = {
            userId: user.id,
            email: user.email,
            role: user.role,
            timestamp: Date.now(),
            createdAt: new Date().toISOString(),
            action: 'group_member_signup'
          };
          
          const redisKey = `microsoft-signup:${state}`;
          console.log('🔧 Storing group member state in Redis:', redisKey);
          
          try {
            await redis.set(redisKey, JSON.stringify(stateData), { EX: 3600 });
            
            // Verify storage immediately
            const verification = await redis.get(redisKey);
            if (!verification) {
              throw new Error('Redis verification failed');
            }
            console.log('🔧 Group member state stored and verified in Redis');
            
          } catch (redisError) {
            console.error('🔧 Redis storage error for group member:', redisError);
            throw new AppError('Failed to store signup state', 500);
          }

          // Generate authorization URL with the correct state
          const authResult = await authService.initiateMicrosoftLogin(state);
          console.log('🔧 Generated auth URL for group member with state:', state);

          // UPDATED: Send invitation email with Microsoft OAuth URL
          let invitationSent = false;
          let invitationError = null;

          try {
            console.log('📧 Testing email service connection for group member...');
            const connectionTest = await emailService.testConnection();
            console.log('📧 Email service connection test for group member:', connectionTest);

            if (!connectionTest) {
              throw new Error('Email service connection failed');
            }

            console.log('📧 Attempting to send Microsoft invitation email to group member...');
            const emailResult = await emailService.sendMicrosoftInvitationEmail(
              user.email,
              user.firstName,
              authResult.authorizationUrl, // Direct Microsoft OAuth URL
              process.env.ORGANIZATION_NAME || 'LMS System'
            );

            console.log('📧 Group member email sent successfully:', {
              messageId: emailResult.messageId,
              response: emailResult.response,
            });

            invitationSent = true;
          } catch (emailError: any) {
            console.error('📧 Group member email sending error:', emailError);
            invitationError = {
              step: 'email_sending',
              error: emailError.message,
              code: emailError.code,
              command: emailError.command,
              responseCode: emailError.responseCode,
            };
          }

          // Update user status based on email success
          const updateStatus = invitationSent ? 'sent' : 'pending';
          await User.update(
            { 
              invitationStatus: updateStatus,
              invitationSentAt: invitationSent ? new Date() : null
            },
            { where: { id: user.id }, transaction }
          );

          microsoftSignup = {
            authorizationUrl: authResult.authorizationUrl,
            state,
            userId: user.id,
            email: user.email,
            invitationSent,
            invitationError: invitationError?.error || null
          };

          if (invitationSent) {
            responseMessage = 'User created and added to group successfully. Microsoft invitation sent via email. User should check their email and click the invitation link.';
          } else {
            responseMessage = 'User created and added to group successfully. Microsoft invitation email failed to send - please resend manually or use the authorization URL.';
          }
          
        } catch (msError) {
          console.error('🔧 Microsoft signup initiation failed for group member:', msError);
          responseMessage = 'User created and added to group successfully. Microsoft invitation setup failed - please configure manually.';
        }
      }

      await transaction.commit();
      return { 
        user, 
        groupUser, 
        message: responseMessage,
        ...(microsoftSignup && { microsoftSignup })
      };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create group member', 500);
    }
  }

  async bulkCreateGroupMembers(
    data: BulkCreateGroupMembersData,
    requesterRole: UserRole
  ) {
    const transaction = await sequelize.transaction();
    try {
      if (!data.groupId || !data.users || !Array.isArray(data.users) || data.users.length === 0) {
        throw new AppError('Group ID and non-empty users array are required', 400);
      }

      const group = await Group.findByPk(data.groupId, { transaction });
      if (!group) {
        throw new AppError('Group not found', 404);
      }

      if (!group.isActive) {
        throw new AppError('Cannot add members to an inactive group', 400);
      }

      const createdUsers: any[] = [];
      const errors: any[] = [];

      for (let i = 0; i < data.users.length; i++) {
        const userData = data.users[i];
        try {
          if (!userData.firstName || !userData.lastName || !userData.email || !userData.signInType || !userData.role) {
            throw new AppError(
              'User firstName, lastName, email, signInType, and role are required',
              400
            );
          }

          if (requesterRole === UserRole.GROUP_LEADER && userData.role !== 'subscriber') {
            throw new AppError('GroupLeader can only create Subscribers', 403);
          }

          if (!['groupLeader', 'subscriber'].includes(userData.role)) {
            throw new AppError('Invalid group role', 400);
          }

          // Verify signInType matches group signInType
          if (userData.signInType !== group.signInType) {
            throw new AppError('User signInType must match group signInType', 400);
          }

          const normalizedEmail = userData.email.toLowerCase().trim();
          const existingUser = await User.findOne({
            where: { email: normalizedEmail },
            transaction,
          });
          if (existingUser) {
            throw new AppError('User with this email already exists', 409);
          }

          // Validate signInType specific requirements
          if (userData.signInType === 'microsoftEntraID') {
            // Microsoft users should not have passwords in bulk creation
            // This is handled automatically below
          }

          const newUserData: any = {
            firstName: userData.firstName.trim(),
            lastName: userData.lastName.trim(),
            email: normalizedEmail,
            role: userData.role,
            signInType: userData.signInType,
            isActive: userData.signInType !== 'microsoftEntraID', // Microsoft users start inactive
          };

          let generatedPassword: string | undefined;

          // Handle different signInTypes
          if (userData.signInType === 'withPassword') {
            generatedPassword = PasswordUtil.generateSecurePassword();
            newUserData.password = await authService.hashPassword(generatedPassword);
          } else if (userData.signInType === 'microsoftEntraID') {
            // Set invitation status for Microsoft users
            newUserData.invitationStatus = 'pending';
            newUserData.isActive = false; // Start inactive until invitation accepted
          } else if (userData.signInType === 'passwordless') {
            // Passwordless users are active but have no password
            newUserData.isActive = true;
          }

          const user = await User.create(newUserData, { transaction });

          const groupUser = await GroupUser.create(
            {
              groupId: data.groupId,
              userId: user.id,
              role: userData.role,
            },
            { transaction }
          );

          let responseMessage = 'User created and added to group successfully';
          let microsoftSignup: any = null;

          // UPDATED: Handle post-creation actions based on signInType with proper email sending
          if (userData.signInType === 'withPassword' && generatedPassword) {
            await otpService.generateAndSendOTP(user.id, user.email, 'verify', generatedPassword, transaction);
            responseMessage = 'User created and added to group successfully, OTP and password sent to email';
          } else if (userData.signInType === 'microsoftEntraID') {
            // UPDATED: For bulk operations, initiate Microsoft signup with proper Redis state management and email sending
            try {
              console.log(`🔧 Initiating Microsoft signup for bulk group member ${i + 1}:`, user.email);
              
              // Generate state and store it in Redis
              const state = this.generateSecureRandomString();
              console.log(`🔧 Generated state for bulk group member ${i + 1}:`, state);
              
              // Store signup data in Redis
              const stateData = {
                userId: user.id,
                email: user.email,
                role: user.role,
                timestamp: Date.now(),
                createdAt: new Date().toISOString(),
                action: 'bulk_group_member_signup'
              };
              
              const redisKey = `microsoft-signup:${state}`;
              console.log(`🔧 Storing bulk group member ${i + 1} state in Redis:`, redisKey);
              
              try {
                await redis.set(redisKey, JSON.stringify(stateData), { EX: 3600 });
                
                // Verify storage immediately
                const verification = await redis.get(redisKey);
                if (!verification) {
                  throw new Error('Redis verification failed');
                }
                console.log(`🔧 Bulk group member ${i + 1} state stored and verified in Redis`);
                
              } catch (redisError) {
                console.error(`🔧 Redis storage error for bulk group member ${i + 1}:`, redisError);
                throw new AppError('Failed to store signup state', 500);
              }

              // Generate authorization URL with the correct state
              const authResult = await authService.initiateMicrosoftLogin(state);
              console.log(`🔧 Generated auth URL for bulk group member ${i + 1} with state:`, state);

              // UPDATED: Send invitation email with Microsoft OAuth URL for bulk operations
              let invitationSent = false;
              let invitationError = null;

              try {
                console.log(`📧 Testing email service connection for bulk group member ${i + 1}...`);
                const connectionTest = await emailService.testConnection();
                console.log(`📧 Email service connection test for bulk group member ${i + 1}:`, connectionTest);

                if (!connectionTest) {
                  throw new Error('Email service connection failed');
                }

                console.log(`📧 Attempting to send Microsoft invitation email to bulk group member ${i + 1}...`);
                const emailResult = await emailService.sendMicrosoftInvitationEmail(
                  user.email,
                  user.firstName,
                  authResult.authorizationUrl, // Direct Microsoft OAuth URL
                  process.env.ORGANIZATION_NAME || 'LMS System'
                );

                console.log(`📧 Bulk group member ${i + 1} email sent successfully:`, {
                  messageId: emailResult.messageId,
                  response: emailResult.response,
                });

                invitationSent = true;
              } catch (emailError: any) {
                console.error(`📧 Bulk group member ${i + 1} email sending error:`, emailError);
                invitationError = {
                  step: 'email_sending',
                  error: emailError.message,
                  code: emailError.code,
                  command: emailError.command,
                  responseCode: emailError.responseCode,
                };
              }

              // Update user status based on email success
              const updateStatus = invitationSent ? 'sent' : 'pending';
              await User.update(
                { 
                  invitationStatus: updateStatus,
                  invitationSentAt: invitationSent ? new Date() : null
                },
                { where: { id: user.id }, transaction }
              );

              microsoftSignup = {
                authorizationUrl: authResult.authorizationUrl,
                state,
                userId: user.id,
                email: user.email,
                invitationSent,
                invitationError: invitationError?.error || null
              };

              if (invitationSent) {
                responseMessage = 'User created and added to group successfully. Microsoft invitation sent via email. User should check their email and click the invitation link.';
              } else {
                responseMessage = 'User created and added to group successfully. Microsoft invitation email failed to send - please resend manually or use the authorization URL.';
              }
              
            } catch (msError) {
              console.error(`🔧 Microsoft signup initiation failed for bulk group member ${i + 1} (${user.email}):`, msError);
              responseMessage = 'User created and added to group successfully. Microsoft invitation setup failed - please configure manually.';
            }
          }

          createdUsers.push({
            user,
            groupUser,
            message: responseMessage,
            ...(microsoftSignup && { microsoftSignup })
          });
        } catch (error) {
          errors.push({
            index: i,
            userData: userData,
            error: error instanceof AppError ? error.message : 'Unknown error',
          });
        }
      }

      await transaction.commit();
      return {
        created: createdUsers,
        errors,
      };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to bulk create group members', 500);
    }
  }

  /**
   * Generate secure random string for OAuth state (consistent with userController)
   */
  private generateSecureRandomString(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  async removeGroupMember(groupId: string, userId: string) {
    const transaction = await sequelize.transaction();
    try {
      if (!groupId || !userId) {
        throw new AppError('Group ID and user ID are required', 400);
      }

      const group = await Group.findByPk(groupId, { transaction });
      if (!group) {
        throw new AppError('Group not found', 404);
      }

      const user = await User.findByPk(userId, { transaction });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const groupUser = await GroupUser.findOne({
        where: { groupId, userId },
        transaction,
      });
      if (!groupUser) {
        throw new AppError('User is not a member of this group', 404);
      }

      await groupUser.destroy({ transaction });

      await transaction.commit();
      return { message: 'User removed from group successfully' };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to remove group member', 500);
    }
  }

  async getGroupMember(groupId: string, userId: string) {
    try {
      if (!groupId || !userId) {
        throw new AppError('Group ID and user ID are required', 400);
      }

      const groupUser = await GroupUser.findOne({
        where: { groupId, userId },
        include: [
          {
            association: 'user',
            attributes: [
              'id',
              'firstName',
              'lastName',
              'email',
              'role',
              'isActive',
              'signInType',
              'invitationStatus',
            ],
          },
        ],
      });

      if (!groupUser) {
        throw new AppError('User is not a member of this group', 404);
      }

      return groupUser;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch group member', 500);
    }
  }
}

export const groupUserService = new GroupUserService();