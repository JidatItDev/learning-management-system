'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// Helper function to hash password (mimicking your AuthService method)
async function hashPassword(password) {
  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Define users with plain text passwords
    const users = [
      {
        id: uuidv4(),
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'adminpass',
        role: 'admin',
        isActive: true,
        signInType: 'withPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        firstName: 'Contributor',
        lastName: 'User',
        email: 'contributor@example.com',
        password: 'contributorpass',
        role: 'contributor',
        isActive: true,
        signInType: 'withPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        firstName: 'Group',
        lastName: 'Leader',
        email: 'groupleader@example.com',
        password: 'groupleaderpass',
        role: 'groupLeader',
        isActive: true,
        signInType: 'withPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        firstName: 'Subscriber',
        lastName: 'User',
        email: 'subscriber@example.com',
        password: 'subscriberpass',
        role: 'subscriber',
        isActive: true,
        signInType: 'withPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Hash passwords for all users
    const usersWithHashedPasswords = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await hashPassword(user.password),
      }))
    );

    await queryInterface.bulkInsert('Users', usersWithHashedPasswords);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
