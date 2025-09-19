import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { IUser } from '../../types/models';

class Token extends Model {
  declare id: string;
  declare userId: string;
  declare token: string;
  declare expiresAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare getUser: () => Promise<IUser>;
  declare setUser: (user: IUser) => Promise<void>;
  declare createUser: (userData: any) => Promise<IUser>;

  static associate(models: any) {
    Token.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE', 
    });
  }
}

Token.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    token: {
      type: DataTypes.TEXT, // Changed to TEXT
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: true,
    },
  },
  {
    tableName: 'Tokens',
    sequelize,
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  }
);

export default Token;