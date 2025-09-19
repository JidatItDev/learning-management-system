import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { IBundle, IUser, IDiscount } from '../../types/models';
import Discount from '../discounts/discounts';
import Bundle from '../bundles/bundles';
import User from '../users/users';

class BundlePurchase extends Model {
  declare id: string;
  declare bundleId: string;
  declare discountId?: string | null;
  declare seatsPurchased: number;
  declare totalPrice: number;
  declare purchasedBy: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  // Association methods
  declare getBundle: () => Promise<IBundle>;
  declare setBundle: (bundle: IBundle) => Promise<void>;

  declare getDiscount: () => Promise<IDiscount | null>;
  declare setDiscount: (discount: IDiscount | null) => Promise<void>;

  declare getPurchasedByUser: () => Promise<IUser>;
  declare setPurchasedByUser: (user: IUser) => Promise<void>;

  declare getGroupBundles: () => Promise<any[]>;
  declare addGroupBundle: (groupBundle: any) => Promise<void>;
  declare removeGroupBundle: (groupBundle: any) => Promise<void>;
  declare hasGroupBundle: (groupBundle: any) => Promise<boolean>;
  declare countGroupBundles: () => Promise<number>;
  declare createGroupBundle: (groupBundleData: any) => Promise<any>;

  static associate(models: any) {
    // Bundle relationship
    BundlePurchase.belongsTo(models.Bundle, {
      foreignKey: 'bundleId',
      as: 'bundle',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    // Discount relationship (optional)
    BundlePurchase.belongsTo(models.Discount, {
      foreignKey: 'discountId',
      as: 'discount',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    // User relationship (purchased by)
    BundlePurchase.belongsTo(models.User, {
      foreignKey: 'purchasedBy',
      as: 'purchasedByUser',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    // Group bundles (one purchase can be allocated to multiple groups)
    BundlePurchase.hasMany(models.GroupBundle, {
      foreignKey: 'bundlePurchaseId',
      as: 'groupBundles',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  }
}

BundlePurchase.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bundleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Bundles',
        key: 'id',
      },
    },
    discountId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Discounts',
        key: 'id',
      },
    },
    seatsPurchased: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    purchasedBy: {
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
    modelName: 'BundlePurchase',
    tableName: 'BundlePurchases',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      { fields: ['bundleId'], name: 'idx_bundle_purchases_bundle_id' },
      { fields: ['discountId'], name: 'idx_bundle_purchases_discount_id' },
      { fields: ['purchasedBy'], name: 'idx_bundle_purchases_purchased_by' },
      { fields: ['createdAt'], name: 'idx_bundle_purchases_created_at' },
    ],
    hooks: {
      async beforeCreate(bundlePurchase: BundlePurchase, options: any) {
        // Validate bundle exists
        const bundle = await Bundle.findByPk(bundlePurchase.bundleId, {
          transaction: options.transaction,
        });
        if (!bundle) {
          throw new AppError('Bundle not found', 404);
        }

        // Validate user exists
        const user = await User.findByPk(bundlePurchase.purchasedBy, {
          transaction: options.transaction,
        });
        if (!user) {
          throw new AppError('PurchasedBy user not found', 404);
        }

        // Validate discount if provided
        if (bundlePurchase.discountId) {
          const discount = await Discount.findByPk(bundlePurchase.discountId, {
            transaction: options.transaction,
          });
          if (!discount) {
            throw new AppError('Discount not found', 404);
          }

          // Check if discount is active
          if (!discount.isActive) {
            throw new AppError('Discount is not active', 400);
          }

          // Check expiry
          if (discount.expiryDate && discount.expiryDate <= new Date()) {
            throw new AppError('Discount has expired', 400);
          }

          // Validate discount applicability with fallback logic
          if (discount.seats) {
            // Check if seats threshold is met
            if (bundlePurchase.seatsPurchased >= discount.seats.seatsThreshold) {
              // Seats discount applies - validation passed
            } 
            // If seats threshold not met, check if percentage fallback is available
            else if (discount.percentage !== null && discount.percentage !== undefined && discount.percentage > 0) {
              // Check bundle applicability for percentage discount
              if (discount.bundleId && discount.bundleId !== bundlePurchase.bundleId) {
                throw new AppError('Discount is not applicable to this bundle', 400);
              }
              // Percentage fallback is valid - validation passed
            }
            // No valid fallback - throw error
            else {
              throw new AppError(
                `Seats purchased must be at least ${discount.seats.seatsThreshold} to apply this discount`,
                400
              );
            }
          } else if (discount.percentage !== null && discount.percentage !== undefined) {
            // Percentage-based discount validation
            if (discount.bundleId && discount.bundleId !== bundlePurchase.bundleId) {
              throw new AppError('Discount is not applicable to this bundle', 400);
            }
          } else {
            throw new AppError('Invalid discount configuration', 400);
          }
        }
      },

      async beforeUpdate(bundlePurchase: BundlePurchase, options: any) {
        // Only validate if discount is being changed
        if (bundlePurchase.changed('discountId') && bundlePurchase.discountId) {
          const discount = await Discount.findByPk(bundlePurchase.discountId, {
            transaction: options.transaction,
          });
          if (!discount) {
            throw new AppError('Discount not found', 404);
          }

          // Check if discount is active
          if (!discount.isActive) {
            throw new AppError('Discount is not active', 400);
          }

          // Check expiry
          if (discount.expiryDate && discount.expiryDate <= new Date()) {
            throw new AppError('Discount has expired', 400);
          }

          // Get current seats purchased (might be updated in same transaction)
          const currentSeats = bundlePurchase.changed('seatsPurchased')
            ? bundlePurchase.seatsPurchased
            : bundlePurchase.previous('seatsPurchased');

          // Validate discount applicability with fallback logic
          if (discount.seats) {
            // Check if seats threshold is met
            if (currentSeats >= discount.seats.seatsThreshold) {
              // Seats discount applies - validation passed
            }
            // If seats threshold not met, check if percentage fallback is available
            else if (discount.percentage !== null && discount.percentage !== undefined && discount.percentage > 0) {
              // Check bundle applicability for percentage discount
              if (discount.bundleId && discount.bundleId !== bundlePurchase.bundleId) {
                throw new AppError('Discount is not applicable to this bundle', 400);
              }
              // Percentage fallback is valid - validation passed
            }
            // No valid fallback - throw error
            else {
              throw new AppError(
                `Seats purchased must be at least ${discount.seats.seatsThreshold} to apply this discount`,
                400
              );
            }
          } else if (discount.percentage !== null && discount.percentage !== undefined) {
            // Percentage-based discount validation
            if (discount.bundleId && discount.bundleId !== bundlePurchase.bundleId) {
              throw new AppError('Discount is not applicable to this bundle', 400);
            }
          } else {
            throw new AppError('Invalid discount configuration', 400);
          }
        }

        // Validate seats purchased if being changed with existing discount
        if (bundlePurchase.changed('seatsPurchased') && bundlePurchase.discountId) {
          const discount = await Discount.findByPk(bundlePurchase.discountId, {
            transaction: options.transaction,
          });
          
          if (discount?.seats) {
            // Check if seats threshold is met
            if (bundlePurchase.seatsPurchased >= discount.seats.seatsThreshold) {
              // Seats discount applies - validation passed
            }
            // If seats threshold not met, check if percentage fallback is available
            else if (discount.percentage !== null && discount.percentage !== undefined && discount.percentage > 0) {
              // Percentage fallback is valid - validation passed
            }
            // No valid fallback - throw error
            else {
              throw new AppError(
                `Seats purchased must be at least ${discount.seats.seatsThreshold} to apply this discount`,
                400
              );
            }
          }
        }
      },
    },
  }
);

export default BundlePurchase;