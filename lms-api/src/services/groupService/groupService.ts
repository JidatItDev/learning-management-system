import Group from '../../models/groups/groups';
import User from '../../models/users/users';
import GroupUser from '../../models/groupUsers/groupUsers';
import { companyService } from '../companyService';
import { userService } from '../userService';
import { authService } from '../authService/authService';
import { AppError } from '../../middleware/errorHandler';
import { Op } from 'sequelize';
import sequelize from '../../config/database';
import {
  CreateGroupData,
  CreateGroupWithLeaderData,
  GroupFilters,
  UpdateGroupData,
} from './group.interface';
import { IGroupUser } from '../../types/models';
import { otpService } from '../otpService/otpService';
import { PasswordUtil } from '../../utils/passwordUtil';
import { Transaction } from 'sequelize';
import { UserRole } from '../../middleware/authenticator';
import redis from '../../config/redis';
import { emailService } from '../../utils/emailService'; // ADDED: Import emailService

export class GroupService {
  async getAllGroups(filters: GroupFilters = {}) {
    try {
      const whereClause: any = {};

      if (filters.name) {
        whereClause.name = { [Op.like]: `%${filters.name}%` };
      }
      if (filters.companyId) {
        whereClause.companyId = filters.companyId;
      }
      if (filters.signInType) {
        whereClause.signInType = filters.signInType;
      }
      if (filters.gophishGroupID) {
        whereClause.gophishGroupID = {
          [Op.like]: `%${filters.gophishGroupID}%`,
        };
      }
      if (filters.search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${filters.search}%` } },
          { gophishGroupID: { [Op.like]: `%${filters.search}%` } },
        ];
      }

      const include = [
        {
          association: 'company',
          attributes: ['id', 'name', 'vatNumber'],
        },
        {
          association: 'createdByUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          association: 'groupUsers',
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
              ],
            },
          ],
          // Apply groupLeaderId filter here
          ...(filters.groupLeaderId
            ? {
                where: { userId: filters.groupLeaderId },
                required: true, // Ensure only groups with this user are returned
              }
            : {}),
        },
        {
          association: 'groupBundles',
          include: [
            {
              association: 'bundlePurchase',
              include: [
                {
                  model: sequelize.models.Bundle,
                  as: 'bundle',
                  attributes: ['id', 'title', 'bundleType', 'seatPrice'],
                },
              ],
            },
          ],
        },
      ];

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: groups } = await Group.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include,
        distinct: true, // Ensure correct count when using includes with where clauses
      });

      return {
        groups,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(count / limit),
          hasPreviousPage: page > 1,
          nextPage: page < Math.ceil(count / limit) ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
      };
    } catch (error) {
      throw new AppError(`Failed to fetch groups`, 500);
    }
  }
  async getGroupById(id: string) {
    try {
      if (!id) {
        throw new AppError('Group ID is required', 400);
      }

      const group = await Group.findByPk(id, {
        include: [
          {
            association: 'company',
            attributes: ['id', 'name', 'vatNumber'],
          },
          {
            association: 'createdByUser',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            association: 'groupUsers',
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
                ],
              },
            ],
          },
          {
            association: 'groupBundles',
            include: [
              {
                association: 'bundlePurchase',
                include: [
                  {
                    association: 'bundle',
                    attributes: ['id', 'title', 'bundleType', 'seatPrice'],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!group) {
        throw new AppError('Group not found', 404);
      }

      return group;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch group', 500);
    }
  }

  async createGroup(data: CreateGroupData & { createdBy: string }) {
    const transaction = await sequelize.transaction();
    try {
      if (
        !data.name ||
        !data.companyId ||
        !data.createdBy ||
        !data.signInType
      ) {
        throw new AppError(
          'Name, company ID, createdBy, and signInType are required',
          400
        );
      }

      const companyExists = await companyService.companyExists(data.companyId);
      if (!companyExists) {
        throw new AppError('Company not found', 404);
      }

      const userExists = await userService.userExists(data.createdBy);
      if (!userExists) {
        throw new AppError('CreatedBy user not found', 404);
      }

      const existingGroup = await Group.findOne({
        where: {
          name: data.name.trim(),
          companyId: data.companyId,
        },
        transaction,
      });

      if (existingGroup) {
        throw new AppError('Group name already exists in this company', 409);
      }

      const group = await Group.create(
        {
          name: data.name.trim(),
          companyId: data.companyId,
          isActive: true,
          createdBy: data.createdBy,
          signInType: data.signInType,
          gophishGroupID: data.gophishGroupID,
        },
        { transaction }
      );

      await transaction.commit();
      return await this.getGroupById(group.id);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create group', 500);
    }
  }

  async createGroupWithLeader(
    data: CreateGroupWithLeaderData & { createdBy: string },
    transaction?: Transaction
  ) {
    const t = transaction || (await sequelize.transaction());
    try {
      if (
        !data.name ||
        !data.companyId ||
        !data.groupLeader ||
        !data.signInType
      ) {
        throw new AppError(
          'Name, company ID, group leader data, and signInType are required',
          400
        );
      }

      const { firstName, lastName, email, signInType } = data.groupLeader;

      if (!firstName || !lastName || !email || !signInType) {
        throw new AppError(
          'Group leader firstName, lastName, email, and signInType are required',
          400
        );
      }

      if (signInType !== data.signInType) {
        throw new AppError(
          'Group leader signInType must match group signInType',
          400
        );
      }

      const companyExists = await companyService.companyExists(data.companyId);
      if (!companyExists) {
        throw new AppError('Company not found', 404);
      }

      const existingGroup = await Group.findOne({
        where: {
          name: data.name.trim(),
          companyId: data.companyId,
        },
        transaction: t,
      });

      if (existingGroup) {
        throw new AppError('Group name already exists in this company', 409);
      }

      let user;
      let generatedPassword: string | undefined;
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = await User.findOne({
        where: { email: normalizedEmail },
        transaction: t,
      });

      if (existingUser) {
        // Verify signInType matches
        if (existingUser.signInType !== signInType) {
          throw new AppError(
            `User exists with different signInType (${existingUser.signInType})`,
            409
          );
        }
        // Verify role is groupLeader
        if (existingUser.role !== 'groupLeader') {
          throw new AppError(
            `User exists with role (${existingUser.role}), must be groupLeader`,
            409
          );
        }
        user = existingUser;
      } else {
        // Create new user based on signInType
        const groupLeaderData: any = {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: normalizedEmail,
          role: 'groupLeader',
          signInType: signInType,
          isActive: signInType !== 'microsoftEntraID', // Microsoft users start inactive
        };

        if (signInType === 'withPassword') {
          generatedPassword = PasswordUtil.generateSecurePassword();
          groupLeaderData.password =
            await authService.hashPassword(generatedPassword);
        } else if (signInType === 'microsoftEntraID') {
          // Set invitation status and disable password
          groupLeaderData.invitationStatus = 'pending';
          if (data.groupLeader.password) {
            throw new AppError(
              'Password is not allowed for microsoftEntraID signInType',
              400
            );
          }
        } else if (signInType === 'passwordless') {
          // Passwordless users are active but have no password
          groupLeaderData.isActive = true;
        }

        user = await User.create(groupLeaderData, { transaction: t });
      }

      // Create group
      const group = await Group.create(
        {
          name: data.name.trim(),
          companyId: data.companyId,
          isActive: true,
          createdBy: data.createdBy,
          signInType: data.signInType,
          gophishGroupID: data.gophishGroupID,
        },
        { transaction: t }
      );

      // Check if user is already in the group
      const existingGroupUser = await GroupUser.findOne({
        where: {
          groupId: group.id,
          userId: user.id,
        },
        transaction: t,
      });

      if (existingGroupUser) {
        throw new AppError('User is already a member of this group', 409);
      }

      // Add user to group as groupLeader
      await GroupUser.create(
        {
          groupId: group.id,
          userId: user.id,
          role: 'groupLeader',
        },
        { transaction: t }
      );

      let responseMessage = 'Group and leader created successfully';
      let microsoftSignup: any = null;

      // UPDATED: Handle post-creation actions based on signInType with proper email sending
      if (!existingUser) {
        if (signInType === 'withPassword' && generatedPassword) {
          // Send OTP with password for withPassword users
          await otpService.generateAndSendOTP(
            user.id,
            user.email,
            'verify',
            generatedPassword,
            t
          );
          responseMessage =
            'Group and leader created successfully, OTP and password sent to email';
        } else if (signInType === 'microsoftEntraID') {
          // UPDATED: Handle Microsoft signup initiation with proper email sending
          try {
            console.log(
              '🔧 Initiating Microsoft signup for group leader:',
              user.email
            );

            // Generate state and store it in Redis
            const state = this.generateSecureRandomString();
            console.log('🔧 Generated state for group leader:', state);

            // Store signup data in Redis
            const stateData = {
              userId: user.id,
              email: user.email,
              role: user.role,
              timestamp: Date.now(),
              createdAt: new Date().toISOString(),
              action: 'group_leader_signup',
            };

            const redisKey = `microsoft-signup:${state}`;
            console.log('🔧 Storing group leader state in Redis:', redisKey);

            try {
              await redis.set(redisKey, JSON.stringify(stateData), {
                EX: 3600,
              });

              // Verify storage immediately
              const verification = await redis.get(redisKey);
              if (!verification) {
                throw new Error('Redis verification failed');
              }
              console.log('🔧 Group leader state stored and verified in Redis');
            } catch (redisError) {
              console.error(
                '🔧 Redis storage error for group leader:',
                redisError
              );
              throw new AppError('Failed to store signup state', 500);
            }

            // Generate authorization URL with the correct state
            const authResult = await authService.initiateMicrosoftLogin(state);
            console.log(
              '🔧 Generated auth URL for group leader with state:',
              state
            );

            // UPDATED: Send invitation email with Microsoft OAuth URL
            let invitationSent = false;
            let invitationError = null;

            try {
              console.log(
                '📧 Testing email service connection for group leader...'
              );
              const connectionTest = await emailService.testConnection();
              console.log(
                '📧 Email service connection test for group leader:',
                connectionTest
              );

              if (!connectionTest) {
                throw new Error('Email service connection failed');
              }

              console.log(
                '📧 Attempting to send Microsoft invitation email to group leader...'
              );
              const emailResult =
                await emailService.sendMicrosoftInvitationEmail(
                  user.email,
                  user.firstName,
                  authResult.authorizationUrl, // Direct Microsoft OAuth URL
                  process.env.ORGANIZATION_NAME || 'LMS System'
                );

              console.log('📧 Group leader email sent successfully:', {
                messageId: emailResult.messageId,
                response: emailResult.response,
              });

              invitationSent = true;
            } catch (emailError: any) {
              console.error('📧 Group leader email sending error:', emailError);
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
                invitationSentAt: invitationSent ? new Date() : null,
              },
              { where: { id: user.id }, transaction: t }
            );

            microsoftSignup = {
              authorizationUrl: authResult.authorizationUrl,
              state,
              userId: user.id,
              email: user.email,
              invitationSent,
              invitationError: invitationError?.error || null,
            };

            if (invitationSent) {
              responseMessage =
                'Group and leader created successfully. Microsoft invitation sent via email. Group leader should check their email and click the invitation link.';
            } else {
              responseMessage =
                'Group and leader created successfully. Microsoft invitation email failed to send - please resend manually or use the authorization URL.';
            }
          } catch (msError) {
            console.error(
              '🔧 Microsoft signup initiation failed for group leader:',
              msError
            );
            responseMessage =
              'Group and leader created successfully. Microsoft invitation setup failed - please configure manually.';
          }
        }
      }

      if (!transaction) {
        await t.commit();
      }

      const result = await this.getGroupById(group.id);
      return {
        ...result.toJSON(),
        message: responseMessage,
        // Include Microsoft signup info if applicable
        ...(microsoftSignup && { microsoftSignup }),
      };
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      console.error('Error in createGroupWithLeader:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create group with leader', 500);
    }
  }

  /**
   * Generate secure random string for OAuth state (same as userController)
   */
  private generateSecureRandomString(length: number = 32): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  async updateGroup(id: string, data: UpdateGroupData) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) {
        throw new AppError('Group ID is required', 400);
      }

      const group = await Group.findByPk(id, { transaction });
      if (!group) {
        throw new AppError('Group not found', 404);
      }

      if (data.name && data.name !== group.name) {
        const existingGroup = await Group.findOne({
          where: {
            name: data.name.trim(),
            companyId: group.companyId,
            id: { [Op.ne]: id },
          },
          transaction,
        });

        if (existingGroup) {
          throw new AppError('Group name already exists in this company', 409);
        }
      }

      const updateData: any = {};
      if (data.name) updateData.name = data.name.trim();
      if (data.signInType) updateData.signInType = data.signInType;
      if (data.gophishGroupID !== undefined)
        updateData.gophishGroupID = data.gophishGroupID;

      await group.update(updateData, { transaction });

      await transaction.commit();
      return await this.getGroupById(id);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update group', 500);
    }
  }

  async toggleGroupStatus(id: string) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) {
        throw new AppError('Group ID is required', 400);
      }

      const group = await Group.findByPk(id, {
        include: [
          {
            association: 'groupUsers',
            include: [
              {
                association: 'user',
                attributes: ['id', 'isActive', 'signInType'],
              },
            ],
          },
        ],
        transaction,
      });

      if (!group) {
        throw new AppError('Group not found', 404);
      }

      const newStatus = !group.isActive;

      await group.update({ isActive: newStatus }, { transaction });

      if (!newStatus) {
        const groupUsers = await group.getGroupUsers();
        for (const groupUser of groupUsers as IGroupUser[]) {
          const user = await groupUser.getUser();
          if (user && user.isActive) {
            await user.update({ isActive: false }, { transaction });
          }
        }
      }

      await transaction.commit();
      return await this.getGroupById(id);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to toggle group status', 500);
    }
  }

  async deleteGroup(id: string) {
    const transaction = await sequelize.transaction();
    try {
      if (!id) {
        throw new AppError('Group ID is required', 400);
      }

      const group = await Group.findByPk(id, { transaction });
      if (!group) {
        throw new AppError('Group not found', 404);
      }

      await group.destroy({ transaction });

      await transaction.commit();
      return { message: 'Group deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete group', 500);
    }
  }

  async groupExists(id: string): Promise<boolean> {
    try {
      const group = await Group.findByPk(id);
      return !!group;
    } catch (error) {
      return false;
    }
  }

  async getGroupsByCompanyId(companyId: string) {
    try {
      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      const groups = await Group.findAll({
        where: { companyId },
        order: [['createdAt', 'DESC']],
        include: [
          {
            association: 'groupUsers',
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
                ],
              },
            ],
          },
          {
            association: 'groupBundles',
            include: [
              {
                association: 'bundlePurchase',
                include: [
                  {
                    association: 'bundle',
                    attributes: ['id', 'title', 'bundleType', 'seatPrice'],
                  },
                ],
              },
            ],
          },
        ],
      });

      return groups;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch groups for company', 500);
    }
  }

  async getGroupMembers(groupId: string) {
    try {
      if (!groupId) {
        throw new AppError('Group ID is required', 400);
      }

      const group = await Group.findByPk(groupId, {
        include: [
          {
            association: 'groupUsers',
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
                ],
              },
            ],
          },
        ],
      });

      if (!group) {
        throw new AppError('Group not found', 404);
      }

      const groupUsers = await group.getGroupUsers();
      const members = await Promise.all(
        groupUsers.map(async (gu: IGroupUser) => {
          const user = await gu.getUser();
          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            signInType: user.signInType,
          };
        })
      );

      return members;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch group members', 500);
    }
  }

  async addGroupUser(
    groupId: string,
    userId: string,
    role: 'groupLeader' | 'subscriber'
  ) {
    const transaction = await sequelize.transaction();
    try {
      const group = await Group.findByPk(groupId, { transaction });
      if (!group) {
        throw new AppError('Group not found', 404);
      }

      const user = await User.findByPk(userId, { transaction });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.signInType !== group.signInType) {
        throw new AppError('User signInType must match group signInType', 400);
      }

      const existingGroupUser = await GroupUser.findOne({
        where: { groupId, userId },
        transaction,
      });
      if (existingGroupUser) {
        throw new AppError('User is already a member of this group', 409);
      }

      await GroupUser.create({ groupId, userId, role }, { transaction });

      await transaction.commit();
      return { message: 'User added to group successfully' };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to add user to group', 500);
    }
  }
}

export const groupService = new GroupService();
