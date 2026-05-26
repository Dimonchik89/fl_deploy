'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('ADMIN', 'USER'),
        allowNull: false,
        defaultValue: 'USER',
      },
      hashedRefreshToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      subscription: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'free',
      },
      maxFolderSize: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      stripeCustomerId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      subscriptionId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referralCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referredById: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
    // In Postgres, we might need to drop the enum type manually if it's not dropped with the table
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_role";');
  },
};
