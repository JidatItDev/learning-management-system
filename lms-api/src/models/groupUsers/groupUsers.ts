import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { IGroup, IUser } from '../../types/models';

class GroupUser extends Model {
  declare id: string;
  declare groupId: string;
  declare userId: string;
  declare role: 'groupLeader' | 'subscriber';
  declare createdAt: Date;
  declare updatedAt: Date;

  // Association methods (these will be added by Sequelize)
  declare getGroup: () => Promise<IGroup>;
  declare setGroup: (group: IGroup) => Promise<void>;
  declare getUser: () => Promise<IUser>;
  declare setUser: (user: IUser) => Promise<void>;

  static associate(models: any) {
    GroupUser.belongsTo(models.Group, {
      foreignKey: 'groupId',
      as: 'group',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    GroupUser.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
}

GroupUser.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    groupId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Groups',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM('groupLeader', 'subscriber'),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'GroupUser',
    tableName: 'GroupUsers',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { fields: ['groupId'], name: 'idx_group_users_group_id' },
      { fields: ['userId'], name: 'idx_group_users_user_id' },
      {
        fields: ['groupId', 'userId'],
        name: 'idx_group_users_group_user',
        unique: true,
      },
      { fields: ['role'], name: 'idx_group_users_role' },
    ],
  }
);

export default GroupUser;
