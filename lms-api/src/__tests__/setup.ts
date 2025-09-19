// Mock dotenv to prevent accidental .env loading
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

// src/__tests__/setup.ts
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.AZURE_CLIENT_ID = 'd3e5e766-4d13-4b86-a71c-9f932bdec989';
process.env.AZURE_CLIENT_SECRET = '312fbba9-a452-466e-aec4-4167c5d303d1';
process.env.AZURE_TENANT_ID = 'f9ad095b-2dd2-4ce0-be33-42325104ba86';
process.env.AZURE_REDIRECT_URI = 'http://localhost:3000/api/auth/microsoft/callback';
process.env.BCRYPT_SALT_ROUNDS = '10';