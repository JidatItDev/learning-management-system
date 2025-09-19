import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { validate as uuidValidate } from 'uuid';

export interface SeatsDiscount {
  percentage: number;
  seatsThreshold: number;
}

class Discount extends Model {
  declare id: string;
  declare bundleId?: string | null;
  declare percentage?: number | null;
  declare seats?: SeatsDiscount | null;
  declare expiryDate?: Date | null;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;

  static associate(models: any) {
    // Discount can be used in many bundle purchases
    Discount.hasMany(models.BundlePurchase, {
      foreignKey: 'discountId',
      as: 'bundlePurchases',
      onDelete: 'SET NULL', // When discount is deleted, purchases keep their record but lose discount
      onUpdate: 'CASCADE',
    });
  }
}

Discount.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bundleId: {
      type: DataTypes.UUID,
      allowNull: true,
      validate: {
        isValidBundleId(value: string | null) {
          if (value && !uuidValidate(value)) {
            throw new AppError('bundleId must be a valid UUID', 400);
          }
        },
      },
    },
    percentage: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'percentage must be at least 0',
        },
        max: {
          args: [100],
          msg: 'percentage cannot exceed 100',
        },
      },
    },
    seats: {
      type: DataTypes.JSON, // JSON for MySQL
      allowNull: true,
      validate: {
        isValidSeats(value: SeatsDiscount | null) {
          if (value) {
            if (
              typeof value.percentage !== 'number' ||
              typeof value.seatsThreshold !== 'number'
            ) {
              throw new AppError(
                'seats must have percentage and seatsThreshold as numbers',
                400
              );
            }
            if (value.percentage < 0 || value.percentage > 100) {
              throw new AppError(
                'seats.percentage must be between 0 and 100',
                400
              );
            }
            if (value.seatsThreshold < 1) {
              throw new AppError(
                'seats.seatsThreshold must be at least 1',
                400
              );
            }
          }
        },
      },
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isFuture(value: Date | null) {
          if (value && value <= new Date()) {
            throw new AppError('expiryDate must be in the future', 400);
          }
        },
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Discount',
    tableName: 'Discounts',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { fields: ['percentage'], name: 'idx_discounts_percentage' },
      { fields: ['expiryDate'], name: 'idx_discounts_expiry_date' },
      { fields: ['bundleId'], name: 'idx_discounts_bundle_id' },
      { fields: ['isActive'], name: 'idx_discounts_is_active' },
    ],
    hooks: {
      beforeCreate: async (discount: Discount, options: any) => {
        if (!discount.percentage && !discount.seats) {
          throw new AppError(
            'At least one of percentage or seats is required',
            400
          );
        }
      },
      beforeUpdate: async (discount: Discount, options: any) => {
        if (!discount.percentage && !discount.seats) {
          throw new AppError(
            'At least one of percentage or seats is required',
            400
          );
        }
      },
    },
  }
);

export default Discount;