import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'LMS API',
      version: '1.0.0',
      description: 'API for LMS Database Revamp',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}/api/v1` }],
  },
  apis: ['./src/routes/v1/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
