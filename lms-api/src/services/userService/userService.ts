// FIXED UserService - State Management and Redis Issues
// Key fixes:
// 1. Removed duplicate Microsoft invitation functionality from service
// 2. Fixed state management issues
// 3. Simplified Redis operations
// 4. Removed conflicting invitation methods

import { User, Group, GroupUser, Company, Token } from '../../models';
import { AppError } from '../../middleware/errorHandler';
import { Op } from 'sequelize';
import { CreateUserData, UpdateUserData, UserFilters, MicrosoftSignupData } from './user.interface';
import { authService } from '../authService/authService';
import { UserRole } from '../../middleware/authenticator';
import axios from 'axios';
import { MicrosoftGraphUserInfo } from '../authService';
import { PasswordUtil } from '../../utils/passwordUtil';
import redis from '../../config/redis';

export class UserService {
  async getAllUsers(filters: UserFilters = {}) {
    try {
      const whereClause: any = {};

      // Build where clause
      if (filters.firstName) {
        whereClause.firstName = { [Op.like]: `%${filters.firstName}%` };
      }
      if (filters.lastName) {
        whereClause.lastName = { [Op.like]: `%${filters.lastName}%` };
      }
      if (filters.email) {
        whereClause.email = { [Op.like]: `%${filters.email}%` };
      }
      if (filters.role) {
        whereClause.role = filters.role;
      }
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }
      if (filters.invitationStatus) {
        whereClause.invitationStatus = filters.invitationStatus;
      }
      if (filters.search) {
        whereClause[Op.or] = [
          { firstName: { [Op.like]: `%${filters.search}%` } },
          { lastName: { [Op.like]: `%${filters.search}%` } },
          { email: { [Op.like]: `%${filters.search}%` } },
        ];
      }

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        attributes: { exclude: ['password'] },
        include: [
          {
            model: GroupUser,
            as: 'groupUsers',
            required: false,
            include: [
              {
                model: Group,
                as: 'group',
                attributes: ['id', 'name', 'companyId', 'signInType', 'gophishGroupID'],
                include: [
                  {
                    model: Company,
                    as: 'company',
                    attributes: ['id', 'name', 'vatNumber', 'address'],
                  },
                ],
              },
            ],
          },
        ],
      });

      // Add helper properties to each user
      const usersWithHelpers = users.map(user => ({
        ...user.toJSON(),
        canSignIn: user.canSignIn(),
        isInvitationPending: user.isInvitationPending(),
        needsInvitationAcceptance: user.signInType === 'microsoftEntraID' && !user.isInvitationAccepted(),
      }));

      const totalPages = Math.ceil(count / limit);

      return {
        users: usersWithHelpers,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
      };
    } catch (error) {
      throw new AppError('Failed to fetch users', 500);
    }
  }

  async getUserById(id: string) {
    try {
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            association: 'groupUsers',
            include: [
              {
                association: 'group',
                attributes: ['id', 'name', 'companyId', 'signInType', 'gophishGroupID'],
                include: [
                  {
                    association: 'company',
                    attributes: ['id', 'name', 'vatNumber', 'address'],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Add helper properties
      const userWithHelpers = {
        ...user.toJSON(),
        canSignIn: user.canSignIn(),
        isInvitationPending: user.isInvitationPending(),
        needsInvitationAcceptance: user.signInType === 'microsoftEntraID' && !user.isInvitationAccepted(),
      };

      return userWithHelpers;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch user', 500);
    }
  }

  async getUserByEmail(email: string) {
    try {
      const user = await User.findOne({
        where: { email: email.toLowerCase().trim() },
        attributes: { exclude: ['password'] },
        include: [
          {
            association: 'groupUsers',
            include: [
              {
                association: 'group',
                attributes: ['id', 'name', 'companyId', 'signInType', 'gophishGroupID'],
              },
            ],
          },
        ],
      });

      if (!user) {
        return null;
      }

      // Add helper properties
      const userWithHelpers = {
        ...user.toJSON(),
        canSignIn: user.canSignIn(),
        isInvitationPending: user.isInvitationPending(),
        needsInvitationAcceptance: user.signInType === 'microsoftEntraID' && !user.isInvitationAccepted(),
      };

      return userWithHelpers;
    } catch (error) {
      throw new AppError('Failed to fetch user by email', 500);
    }
  }

  async createUser(data: CreateUserData) {
    try {
      if (
        !data.firstName ||
        !data.lastName ||
        !data.email ||
        !data.role ||
        !data.signInType
      ) {
        throw new AppError(
          'firstName, lastName, email, role, and signInType are required',
          400
        );
      }

      const existingUser = await User.findOne({
        where: { email: data.email.toLowerCase().trim() },
      });

      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      if (!this.isValidEmail(data.email)) {
        throw new AppError('Invalid email format', 400);
      }

      if (data.signInType === 'microsoftEntraID' && data.password) {
        throw new AppError(
          'Password is not allowed for microsoftEntraID signInType',
          400
        );
      }

      const userData: any = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        role: data.role,
        signInType: data.signInType,
        isActive: data.isActive !== undefined ? data.isActive : true,
        invitationStatus: data.invitationStatus || (data.signInType === 'microsoftEntraID' ? 'pending' : 'none'),
        microsoftUserId: data.microsoftUserId || null,
      };

      // Set isActive to false for Microsoft users until invitation is accepted
      if (data.signInType === 'microsoftEntraID') {
        userData.isActive = false;
      }

      if (data.signInType === 'withPassword') {
        userData.password = await authService.hashPassword(data.password || PasswordUtil.generateSecurePassword());
      }

      const user = await User.create(userData);
      
      // Add helper properties to return
      const { password, ...userWithoutPassword } = user.toJSON();
      return {
        ...userWithoutPassword,
        canSignIn: user.canSignIn(),
        isInvitationPending: user.isInvitationPending(),
        needsInvitationAcceptance: user.signInType === 'microsoftEntraID' && !user.isInvitationAccepted(),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create user', 500);
    }
  }

  // REMOVED: Removed duplicate Microsoft signup and invitation methods
  // These are now handled in the UserController to avoid state management conflicts

  async updateUser(id: string, data: UpdateUserData) {
    try {
      const user = await User.findByPk(id);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (data.email && data.email.toLowerCase().trim() !== user.email) {
        const existingUser = await User.findOne({
          where: {
            email: data.email.toLowerCase().trim(),
            id: { [Op.ne]: id },
          },
        });

        if (existingUser) {
          throw new AppError('User with this email already exists', 409);
        }

        if (!this.isValidEmail(data.email)) {
          throw new AppError('Invalid email format', 400);
        }
      }

      if (
        data.signInType === 'withPassword' &&
        !data.password &&
        !user.password
      ) {
        throw new AppError(
          'Password is required for withPassword signInType',
          400
        );
      }

      if (data.signInType === 'microsoftEntraID' && data.password) {
        throw new AppError(
          'Password is not allowed for microsoftEntraID signInType',
          400
        );
      }

      const updateData: any = {};
      if (data.firstName) updateData.firstName = data.firstName.trim();
      if (data.lastName) updateData.lastName = data.lastName.trim();
      if (data.email) updateData.email = data.email.toLowerCase().trim();
      if (data.role) updateData.role = data.role;
      if (data.signInType) updateData.signInType = data.signInType;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.invitationStatus) updateData.invitationStatus = data.invitationStatus;
      if (data.invitationSentAt !== undefined) updateData.invitationSentAt = data.invitationSentAt;
      if (data.invitationAcceptedAt !== undefined) updateData.invitationAcceptedAt = data.invitationAcceptedAt;
      if (data.microsoftUserId !== undefined) updateData.microsoftUserId = data.microsoftUserId;
      if (data.password)
        updateData.password = await authService.hashPassword(data.password);

      await user.update(updateData);
      
      const { password, ...userWithoutPassword } = user.toJSON();
      return {
        ...userWithoutPassword,
        canSignIn: user.canSignIn(),
        isInvitationPending: user.isInvitationPending(),
        needsInvitationAcceptance: user.signInType === 'microsoftEntraID' && !user.isInvitationAccepted(),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update user', 500);
    }
  }

  async deleteUser(id: string) {
    try {
      const user = await User.findByPk(id);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      await user.destroy();
      return { message: 'User deleted successfully' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete user', 500);
    }
  }

  async toggleUserStatus(id: string) {
    try {
      const user = await User.findByPk(id);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // For Microsoft users, ensure invitation is accepted before activating
      if (user.signInType === 'microsoftEntraID' && !user.isActive && !user.isInvitationAccepted()) {
        throw new AppError('Cannot activate Microsoft user with unaccepted invitation', 400);
      }

      await user.update({ isActive: !user.isActive });
      
      const { password, ...userWithoutPassword } = user.toJSON();
      return {
        ...userWithoutPassword,
        canSignIn: user.canSignIn(),
        isInvitationPending: user.isInvitationPending(),
        needsInvitationAcceptance: user.signInType === 'microsoftEntraID' && !user.isInvitationAccepted(),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to toggle user status', 500);
    }
  }

  async userExists(id: string): Promise<boolean> {
    try {
      const user = await User.findByPk(id);
      return !!user;
    } catch (error) {
      return false;
    }
  }

  async getUsersByRole(
    role: 'admin' | 'contributor' | 'groupLeader' | 'subscriber'
  ) {
    try {
      const users = await User.findAll({
        where: { role },
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
      });

      // Add helper properties
      return users.map(user => ({
        ...user.toJSON(),
        canSignIn: user.canSignIn(),
        isInvitationPending: user.isInvitationPending(),
        needsInvitationAcceptance: user.signInType === 'microsoftEntraID' && !user.isInvitationAccepted(),
      }));
    } catch (error) {
      throw new AppError('Failed to fetch users by role', 500);
    }
  }

  async getUserGroups(userId: string) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            association: 'groupUsers',
            include: [
              {
                association: 'group',
                attributes: ['id', 'name', 'companyId'],
                include: [
                  {
                    association: 'company',
                    attributes: ['id', 'name', 'vatNumber'],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user.getGroupUsers;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch user groups', 500);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const userService = new UserService();