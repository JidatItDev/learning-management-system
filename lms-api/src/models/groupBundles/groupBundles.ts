import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import BundlePurchase from '../bundlePurchases/bundlePurchases';

class GroupBundle extends Model {
  declare id: string;
  declare groupId: string;
  declare bundlePurchaseId: string;
  declare seatsAllocated: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    GroupBundle.belongsTo(models.Group, {
      foreignKey: 'groupId',
      as: 'group',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    GroupBundle.belongsTo(models.BundlePurchase, {
      foreignKey: 'bundlePurchaseId',
      as: 'bundlePurchase',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  }
}

GroupBundle.init(
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
    bundlePurchaseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'BundlePurchases',
        key: 'id',
      },
    },
    seatsAllocated: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
  },
  {
    sequelize,
    modelName: 'GroupBundle',
    tableName: 'GroupBundles',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { fields: ['groupId'], name: 'idx_group_bundles_group_id' },
      {
        fields: ['bundlePurchaseId'],
        name: 'idx_group_bundles_bundle_purchase_id',
      },
    ],
    hooks: {
      async beforeCreate(groupBundle: GroupBundle, options: any) {
        const group = await sequelize.models.Group.findByPk(
          groupBundle.groupId,
          {
            transaction: options.transaction,
          }
        );
        if (!group) {
          throw new AppError('Group not found', 404);
        }
        const bundlePurchase = (await sequelize.models.BundlePurchase.findByPk(
          groupBundle.bundlePurchaseId,
          { transaction: options.transaction }
        )) as BundlePurchase;
        if (!bundlePurchase) {
          throw new AppError('BundlePurchase not found', 404);
        }
        if (groupBundle.seatsAllocated > bundlePurchase.seatsPurchased) {
          throw new AppError(
            'Seats allocated cannot exceed seats purchased',
            400
          );
        }
      },
      async beforeUpdate(groupBundle: GroupBundle, options: any) {
        if (groupBundle.changed('seatsAllocated')) {
          const bundlePurchase =
            (await sequelize.models.BundlePurchase.findByPk(
              groupBundle.bundlePurchaseId,
              { transaction: options.transaction }
            )) as BundlePurchase;
          if (!bundlePurchase) {
            throw new AppError('BundlePurchase not found', 404);
          }
          if (groupBundle.seatsAllocated > bundlePurchase.seatsPurchased) {
            throw new AppError(
              'Seats allocated cannot exceed seats purchased',
              400
            );
          }
        }
      },
    },
  }
);

export default GroupBundle;
