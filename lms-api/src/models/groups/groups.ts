import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { ICompany, IUser, IGroupUser, IBundle } from '../../types/models';
import { AppError } from '../../middleware/errorHandler';

class Group extends Model {
  declare id: string;
  declare companyId: string;
  declare name: string;
  declare isActive: boolean;
  declare gophishGroupID?: string;
  declare signInType: 'withPassword' | 'passwordless' | 'microsoftEntraID';
  declare createdBy: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Company associations
  declare getCompany: () => Promise<ICompany>;
  declare setCompany: (company: ICompany) => Promise<void>;
  declare createCompany: (companyData: any) => Promise<ICompany>;

  // User associations (many-to-many)
  declare getUsers: () => Promise<IUser[]>;
  declare addUser: (user: IUser, options?: { through?: any }) => Promise<void>;
  declare removeUser: (user: IUser) => Promise<void>;
  declare hasUser: (user: IUser) => Promise<boolean>;
  declare countUsers: () => Promise<number>;
  declare setUsers: (users: IUser[], options?: { through?: any }) => Promise<void>;

  // GroupUser associations (junction table)
  declare getGroupUsers: () => Promise<IGroupUser[]>;
  declare addGroupUser: (groupUser: IGroupUser) => Promise<void>;
  declare removeGroupUser: (groupUser: IGroupUser) => Promise<void>;
  declare hasGroupUser: (groupUser: IGroupUser) => Promise<boolean>;
  declare countGroupUsers: () => Promise<number>;
  declare createGroupUser: (groupUserData: any) => Promise<IGroupUser>;

  // Created by user association
  declare getCreatedByUser: () => Promise<IUser>;
  declare setCreatedByUser: (user: IUser) => Promise<void>;

  // Bundle associations through GroupBundle
  declare getGroupBundles: () => Promise<any[]>;
  declare addGroupBundle: (groupBundle: any) => Promise<void>;
  declare removeGroupBundle: (groupBundle: any) => Promise<void>;
  declare hasGroupBundle: (groupBundle: any) => Promise<boolean>;
  declare countGroupBundles: () => Promise<number>;
  declare createGroupBundle: (groupBundleData: any) => Promise<any>;

  // Note: Schedule attack simulations association removed since we're using JSON array approach

  static associate(models: any) {
    // Company relationship
    Group.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Created by user relationship
    Group.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'createdByUser',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    // Many-to-many relationship with users through GroupUser
    Group.belongsToMany(models.User, {
      through: models.GroupUser,
      foreignKey: 'groupId',
      otherKey: 'userId',
      as: 'users',
    });

    // Direct relationship with GroupUser junction table
    Group.hasMany(models.GroupUser, {
      foreignKey: 'groupId',
      as: 'groupUsers',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // Relationship with GroupBundle (groups can have multiple bundle purchases)
    Group.hasMany(models.GroupBundle, {
      foreignKey: 'groupId',
      as: 'groupBundles',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    // REMOVED: Many-to-many relationship with ScheduleAttackSimulation
    // Since we're using JSON array approach in ScheduleAttackSimulation.groupIds
  }
}

Group.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Companies',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    gophishGroupID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    signInType: {
      type: DataTypes.ENUM('withPassword', 'passwordless', 'microsoftEntraID'),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Group',
    tableName: 'Groups',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { fields: ['companyId'], name: 'idx_groups_company_id' },
      { fields: ['name'], name: 'idx_groups_name' },
      {
        fields: ['companyId', 'name'],
        name: 'idx_groups_company_name',
        unique: true,
      },
      { fields: ['isActive'], name: 'idx_groups_is_active' },
      { fields: ['createdBy'], name: 'idx_groups_created_by' },
      { fields: ['signInType'], name: 'idx_groups_sign_in_type' },
    ],
    hooks: {
      async beforeCreate(group: Group, options: any) {
        const user = await sequelize.models.User.findByPk(group.createdBy, {
          transaction: options.transaction,
        });
        if (!user) {
          throw new AppError('Invalid createdBy user ID', 400);
        }
      },
      async beforeUpdate(group: Group, options: any) {
        if (group.changed('signInType')) {
          const groupUsers = await group.getGroupUsers();
          for (const groupUser of groupUsers) {
            const user = await groupUser.getUser();
            if (user && user.signInType !== group.signInType) {
              throw new AppError(
                'All group users must have the same signInType as the group',
                400
              );
            }
          }
        }
      },
    },
  }
);

export default Group;