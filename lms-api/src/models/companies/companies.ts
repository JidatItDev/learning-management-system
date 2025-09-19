import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { IGroup } from '../../types/models';
import { AppError } from '../../middleware/errorHandler';

class Company extends Model {
  declare id: string;
  declare name: string;
  declare vatNumber: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare createdBy: string;

  // Association methods (these will be added by Sequelize)
  declare getGroups: () => Promise<IGroup[]>;
  declare addGroup: (group: IGroup) => Promise<void>;
  declare removeGroup: (group: IGroup) => Promise<void>;
  declare hasGroup: (group: IGroup) => Promise<boolean>;
  declare countGroups: () => Promise<number>;
  declare createGroup: (groupData: any) => Promise<IGroup>;

  // Static method for defining associations
  static associate(models: any) {
    Company.hasMany(models.Group, {
      foreignKey: 'companyId',
      as: 'groups',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Company.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'createdByUser',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  }
}

Company.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    vatNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
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
    modelName: 'Company',
    tableName: 'Companies',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { fields: ['name'], name: 'idx_companies_name' },
      { fields: ['vatNumber'], name: 'idx_companies_vat_number' },
      { fields: ['createdBy'], name: 'idx_companies_created_by' },
    ],
    hooks: {
      async beforeCreate(company: Company, options: any) {
        const user = await sequelize.models.User.findByPk(company.createdBy, {
          transaction: options.transaction,
        });
        if (!user) {
          throw new AppError('Invalid createdBy user ID', 400);
        }
      },
    },
  }
);

export default Company;
