import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Skip dotenv in test environment
if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD!,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'mysql',
    logging: process.env.NODE_ENV !== 'production' ? console.log : false,
    define: {
      underscored: false,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

export default sequelize;
