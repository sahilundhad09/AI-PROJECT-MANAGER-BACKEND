'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('task_statuses', 'is_completed', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
        });

        // Backfill: Set is_completed to true for statuses named 'Done' or 'Completed'
        await queryInterface.sequelize.query(`
      UPDATE task_statuses 
      SET is_completed = true 
      WHERE name ILIKE '%Done%' OR name ILIKE '%Completed%'
    `);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('task_statuses', 'is_completed');
    }
};
