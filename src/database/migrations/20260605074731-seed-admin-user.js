'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@test.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await queryInterface.bulkInsert('Users', [
      {
        id: uuidv4(),
        email: adminEmail,
        passwordHash: passwordHash,
        role: 'ADMIN',
        subscription: 'free',
        referralCode: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@test.com';
    await queryInterface.bulkDelete('Users', { email: adminEmail }, {});
  },
};
