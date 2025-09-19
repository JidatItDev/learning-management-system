import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database';
import { ICourse } from '../../types/models';

export enum BundleType {
  PHISHING_SECURITY = 'Simulated Phishing & Security Awareness Training',
  ADVANCE_TRAINING = 'Advance Training',
}

class Bundle extends Model {
    declare id: string;
    declare title: string;
    declare description?: string;
    declare category: string;
    declare bundleType: BundleType;
    declare seatPrice: number;
    declare createdAt?: Date;
    declare updatedAt?: Date;

    // Course association methods (many-to-many)
    declare getCourses: () => Promise<ICourse[]>;
    declare addCourse: (course: ICourse) => Promise<void>;
    declare removeCourse: (course: ICourse) => Promise<void>;
    declare hasCourse: (course: ICourse) => Promise<boolean>;
    declare countCourses: () => Promise<number>;
    declare setCourses: (courses: ICourse[]) => Promise<void>;

    // Bundle purchase association methods
    declare getBundlePurchases: () => Promise<any[]>;
    declare addBundlePurchase: (bundlePurchase: any) => Promise<void>;
    declare removeBundlePurchase: (bundlePurchase: any) => Promise<void>;
    declare hasBundlePurchase: (bundlePurchase: any) => Promise<boolean>;
    declare countBundlePurchases: () => Promise<number>;
    declare createBundlePurchase: (bundlePurchaseData: any) => Promise<any>;

    // Schedule attack simulation methods
    declare getScheduleAttackSimulations: () => Promise<any[]>;
    declare addScheduleAttackSimulation: (schedule: any) => Promise<void>;
    declare removeScheduleAttackSimulation: (schedule: any) => Promise<void>;
    declare hasScheduleAttackSimulation: (schedule: any) => Promise<boolean>;
    declare countScheduleAttackSimulations: () => Promise<number>;
    declare createScheduleAttackSimulation: (scheduleData: any) => Promise<any>;

    // Discount association methods
    declare getDiscounts: () => Promise<any[]>;
    declare addDiscount: (discount: any) => Promise<void>;
    declare removeDiscount: (discount: any) => Promise<void>;
    declare hasDiscount: (discount: any) => Promise<boolean>;
    declare countDiscounts: () => Promise<number>;
    declare createDiscount: (discountData: any) => Promise<any>;

    static associate(models: any) {
      // Bundle belongs to many courses through BundleCourse junction table
      Bundle.belongsToMany(models.Course, {
        through: models.BundleCourse,
        foreignKey: 'bundleId',
        otherKey: 'courseId',
        as: 'courses',
      });

      // NEW ASSOCIATIONS FOR PURCHASE SYSTEM
      // Bundle can have many purchases
      Bundle.hasMany(models.BundlePurchase, {
        foreignKey: 'bundleId',
        as: 'bundlePurchases',
        onDelete: 'RESTRICT', // Prevent deletion of bundles that have been purchased
        onUpdate: 'CASCADE',
      });

      // Bundle can be used in scheduled attack simulations
      Bundle.hasMany(models.ScheduleAttackSimulation, {
        foreignKey: 'bundleId',
        as: 'scheduleAttackSimulations',
        onDelete: 'RESTRICT', // Prevent deletion of bundles used in simulations
        onUpdate: 'CASCADE',
      });

      // Bundle can have many discounts
      Bundle.hasMany(models.Discount, {
        foreignKey: 'bundleId',
        as: 'discounts',
        onDelete: 'CASCADE', // When bundle is deleted, associated discounts are also deleted
        onUpdate: 'CASCADE',
      });
    }
}

Bundle.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    bundleType: {
      type: DataTypes.ENUM(...Object.values(BundleType)),
      allowNull: false,
    },
    seatPrice: {
      type: DataTypes.DECIMAL(10, 2), // Better for currency
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  },
  {
    sequelize,
    modelName: 'Bundle',
    tableName: 'Bundles',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
      {
        fields: ['title'],
        name: 'idx_bundles_title',
      },
      {
        fields: ['category'],
        name: 'idx_bundles_category',
      },
      {
        fields: ['bundleType'],
        name: 'idx_bundles_type',
      },
      {
        fields: ['seatPrice'],
        name: 'idx_bundles_price',
      },
      {
        fields: ['createdAt'],
        name: 'idx_bundles_created_at',
      },
    ],
    hooks: {
      beforeValidate: (bundle: Bundle) => {
        if (bundle.title) {
          bundle.title = bundle.title.trim();
        }
      },
    },
  }
);

export default Bundle;