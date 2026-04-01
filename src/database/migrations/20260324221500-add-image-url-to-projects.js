'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('projects', 'image_url', {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: 'color'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('projects', 'image_url');
  }
};
