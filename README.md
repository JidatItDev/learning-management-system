# Learning Management System

LMS Node.js 22 Boilerplate Setup Guide
Date Created: July 4, 2025, 12:46 PM PKTAuthors: Jidat IT Development Team
Purpose: This guide provides a step-by-step process to set up a reusable Node.js 22 boilerplate with TypeScript, Sequelize for MySQL, Winston logging, Helmet and XSS security, Swagger documentation, ESLint, and Prettier.

Table of Contents

Boilerplate Setup
Step 1: Initialize Project
Step 2: Folder Structure
Step 3: Install Dependencies
Step 4: TypeScript Configuration
Step 5: Sequelize Setup
Step 6: Error Handling Middleware
Step 7: Winston Logging
Step 8: Security (Helmet, XSS)
Step 9: Swagger Setup
Step 10: ESLint and Prettier
Step 11: Scripts and Run Commands

LMS Project Implementation
Step 1: Database Schema with Sequelize
Step 2: API Routes
Step 3: GoPhish Integration
Step 4: Testing Setup

Running the Project
Appendices
Troubleshooting
References

1. Boilerplate Setup
   1.1 Initialize Project

Verify Node.js 22:
Ensure Node.js 22 is installed:node -v

Output should be v22.x.x. If not, install via nvm:nvm install 22
nvm use 22

Create Project Directory:mkdir lms-boilerplate
cd lms-boilerplate
npm init -y

Install TypeScript:npm install typescript ts-node @types/node --save-dev
npx tsc --init

1.2 Folder Structure
lms-boilerplate/
├── src/
│ ├── config/ # Configuration files
│ │ ├── database.ts # Sequelize config
│ │ ├── logger.ts # Winston config
│ │ └── swagger.ts # Swagger config
│ ├── middleware/ # Custom middleware
│ │ ├── errorHandler.ts # Error handling
│ │ └── security.ts # Helmet, XSS
│ ├── routes/ # API routes
│ │ ├── index.ts # Route aggregator
│ │ └── v1/ # Versioned routes
│ ├── models/ # Sequelize models
│ ├── controllers/ # Route handlers
│ ├── services/ # Business logic
│ ├── utils/ # Helper functions
│ ├── types/ # TypeScript types
│ └── app.ts # Express app setup
├── migrations/ # Sequelize migrations
├── tests/ # Test files
├── logs/ # Winston log files
├── .env # Environment variables
├── .eslintrc.js # ESLint config
├── .prettierrc # Prettier config
├── tsconfig.json # TypeScript config
├── package.json # Project metadata
└── README.md # Project documentation

Create Structure:
mkdir -p src/{config,middleware,routes/v1,models,controllers,services,utils,types} migrations tests logs
touch src/{app.ts,config/{database.ts,logger.ts,swagger.ts},middleware/{errorHandler.ts,security.ts},routes/index.ts} .env .eslintrc.js .prettierrc tsconfig.json README.md

1.3 Install Dependencies
npm install express dotenv sequelize mysql2 winston express-winston helmet xss-clean swagger-jsdoc swagger-ui-express uuid @types/uuid axios @types/axios
npm install --save-dev typescript ts-node @types/node @types/express @types/swagger-jsdoc @types/swagger-ui-express @types/helmet eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-config-standard @typescript-eslint/parser @typescript-eslint/eslint-plugin jest @types/jest ts-jest supertest @types/supertest sequelize-cli

package.json:
{
"name": "lms-boilerplate",
"version": "1.0.0",
"type": "module",
"scripts": {
"start": "node --no-warnings dist/app.js",
"dev": "node --no-warnings --watch src/app.ts",
"build": "tsc",
"lint": "eslint src --ext .ts",
"format": "prettier --write src/\*_/_.{ts,js}",
"test": "jest",
"migrate": "sequelize-cli db:migrate",
"migrate:undo": "sequelize-cli db:migrate:undo"
},
"dependencies": {
"axios": "^1.7.7",
"dotenv": "^16.4.5",
"express": "^4.21.1",
"helmet": "^8.0.0",
"mysql2": "^3.11.3",
"sequelize": "^6.37.5",
"swagger-jsdoc": "^6.2.8",
"swagger-ui-express": "^5.0.1",
"uuid": "^10.0.0",
"winston": "^3.15.0",
"xss-clean": "^0.1.4"
},
"devDependencies": {
"@types/axios": "^0.14.0",
"@types/express": "^5.0.0",
"@types/helmet": "^4.0.0",
"@types/jest": "^29.5.14",
"@types/node": "^22.7.5",
"@types/supertest": "^6.0.2",
"@types/swagger-jsdoc": "^6.0.4",
"@types/swagger-ui-express": "^4.1.6",
"@types/uuid": "^10.0.0",
"@types/xss-clean": "^0.1.2",
"@typescript-eslint/eslint-plugin": "^8.8.1",
"@typescript-eslint/parser": "^8.8.1",
"eslint": "^8.57.1",
"eslint-config-prettier": "^9.1.0",
"eslint-config-standard": "^17.1.0",
"eslint-plugin-prettier": "^5.2.1",
"jest": "^29.7.0",
"prettier": "^3.3.3",
"sequelize-cli": "^6.6.2",
"supertest": "^7.0.0",
"ts-jest": "^29.2.5",
"ts-node": "^10.9.2",
"typescript": "^5.6.3"
}
}

1.4 TypeScript Configuration
tsconfig.json:
{
"compilerOptions": {
"target": "ES2022",
"module": "NodeNext",
"outDir": "./dist",
"rootDir": "./src",
"strict": true,
"esModuleInterop": true,
"skipLibCheck": true,
"forceConsistentCasingInFileNames": true,
"moduleResolution": "NodeNext",
"resolveJsonModule": true
},
"include": ["src/**/*"],
"exclude": ["node_modules", "dist"]
}

Note: module and moduleResolution set to NodeNext for Node.js 22 ES module support.
1.5 Sequelize Setup

Install Sequelize CLI:
npm install --save-dev sequelize-cli
npx sequelize-cli init

Deletes auto-generated config, models, migrations, seeders folders; use custom src/models and migrations.

Configure Database:.env:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=lms_db
DB_PORT=3306
PORT=3000
GOPHISH_URL=http://gophish:3333
GOPHISH_API_KEY=your_gophish_api_key

src/config/database.ts:
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
process.env.DB_NAME!,
process.env.DB_USER!,
process.env.DB_PASSWORD!,
{
host: process.env.DB_HOST,
port: Number(process.env.DB_PORT),
dialect: 'mysql',
logging: false
}
);

export default sequelize;

Test Connection:src/utils/dbTest.ts:
import sequelize from '../config/database';

async function testConnection() {
try {
await sequelize.authenticate();
console.log('Database connected');
} catch (error) {
console.error('Database connection failed:', error);
}
}

testConnection();

Run: node --no-warnings src/utils/dbTest.ts

1.6 Error Handling Middleware
src/middleware/errorHandler.ts:
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export class AppError extends Error {
statusCode: number;
constructor(message: string, statusCode: number) {
super(message);
this.statusCode = statusCode;
Error.captureStackTrace(this, this.constructor);
}
}

export const errorHandler = (
err: AppError,
req: Request,
res: Response,
next: NextFunction
) => {
const statusCode = err.statusCode || 500;
const message = err.message || 'Internal Server Error';

logger.error({
message,
statusCode,
stack: err.stack,
path: req.path,
method: req.method
});

res.status(statusCode).json({
error: {
message,
status: statusCode,
timestamp: new Date().toISOString()
}
});
};

1.7 Winston Logging
src/config/logger.ts:
import winston from 'winston';

export const logger = winston.createLogger({
level: 'info',
format: winston.format.combine(
winston.format.timestamp(),
winston.format.json()
),
transports: [
new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
new winston.transports.File({ filename: 'logs/combined.log' })
]
});

if (process.env.NODE_ENV !== 'production') {
logger.add(
new winston.transports.Console({
format: winston.format.simple()
})
);
}

1.8 Security (Helmet, XSS)
src/middleware/security.ts:
import helmet from 'helmet';
import xss from 'xss-clean';
import { Request, Response, NextFunction } from 'express';

export const applySecurity = (req: Request, res: Response, next: NextFunction) => {
helmet()(req, res, () => {
xss()(req, res, next);
});
};

1.9 Swagger Setup
src/config/swagger.ts:
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
definition: {
openapi: '3.0.3',
info: {
title: 'LMS API',
version: '1.0.0',
description: 'API for LMS Database Revamp'
},
servers: [{ url: `http://localhost:${process.env.PORT || 3000}/api/v1` }]
},
apis: ['./src/routes/v1/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);

src/app.ts:
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { applySecurity } from './middleware/security';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

app.use(express.json());
app.use(applySecurity);
app.use('/api/v1', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
logger.info(`Server running on port ${PORT}`);
});

export default app;

1.10 ESLint and Prettier
src/.eslintrc.js:
export default {
env: { node: true, es2022: true },
extends: [
'standard',
'plugin:@typescript-eslint/recommended',
'plugin:prettier/recommended'
],
parser: '@typescript-eslint/parser',
plugins: ['@typescript-eslint', 'prettier'],
rules: {
'prettier/prettier': 'error',
'@typescript-eslint/explicit-module-boundary-types': 'off'
}
};

.prettierrc:
{
"semi": true,
"trailingComma": "es5",
"singleQuote": true,
"printWidth": 80,
"tabWidth": 2
}

1.11 Scripts and Run Commands
package.json scripts (already included). Run:

Development: npm run dev (uses Node.js 22 --watch)
Build: npm run build
Start: npm start
Lint: npm run lint
Format: npm run format
Test: npm run test

Create Migrations: npx sequelize-cli migration:generate --name <filename> --config <fileLocation>
Create Seeders: npx sequelize-cli seed:generate --name <filename> --config <fileLocation>

Run Migrations: npx sequelize-cli db:migrate --env development
Run Seeders: npx sequelize-cli db:seed:all --env development

npx sequelize-cli db:seed --seed <filename> --config <fileLocaton>


Test Database: ts-node src/utils/dbTest.ts
