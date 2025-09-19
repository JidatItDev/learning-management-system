import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/database";

class BundleCourse extends Model {
    declare id: number;
    declare bundleId: string; // Changed to UUID to match Bundle
    declare courseId: string; // Changed to UUID to match Course
    declare createdAt: Date;
    declare updatedAt: Date;

    static associate(models: any) {
        BundleCourse.belongsTo(models.Bundle, { 
            foreignKey: 'bundleId',
            as: 'bundle',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE', 
        });

        BundleCourse.belongsTo(models.Course, { 
            foreignKey: 'courseId',
            as: 'course',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        });
    }
}

BundleCourse.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            autoIncrement: true,
        },
        bundleId: {
            type: DataTypes.UUID, // Changed from INTEGER to UUID
            allowNull: false,
            references: {
                model: 'Bundles',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        courseId: {
            type: DataTypes.UUID, // Changed from INTEGER to UUID
            allowNull: false,
            references: {
                model: 'Courses',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
    },
    {
        sequelize,
        modelName: 'BundleCourse',
        tableName: 'BundleCourses',
        timestamps: true,
        underscored: false,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt', 
        indexes: [
            {
                unique: true,
                fields: ['bundleId', 'courseId'],
                name: 'unique_bundle_course',
            },
            {
                fields: ['bundleId'],
                name: 'idx_bundle_courses_bundle_id',
            },
            {
                fields: ['courseId'],
                name: 'idx_bundle_courses_course_id',
            },
            {
                fields: ['createdAt'],
                name: 'idx_bundle_courses_created_at',
            },
        ]
    }
);

export default BundleCourse;