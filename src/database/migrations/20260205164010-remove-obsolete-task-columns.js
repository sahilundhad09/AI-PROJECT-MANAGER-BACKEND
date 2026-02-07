'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Remove obsolete columns if they exist
        try {
            await queryInterface.removeColumn('task_assignees', 'user_id');
        } catch (error) {
            console.log('Column user_id does not exist in task_assignees, skipping...');
        }

        try {
            await queryInterface.removeColumn('task_assignees', 'assigned_by');
        } catch (error) {
            console.log('Column assigned_by does not exist in task_assignees, skipping...');
        }

        try {
            await queryInterface.removeColumn('task_tags', 'project_id');
        } catch (error) {
            console.log('Column project_id does not exist in task_tags, skipping...');
        }

        try {
            await queryInterface.removeColumn('task_tags', 'name');
        } catch (error) {
            console.log('Column name does not exist in task_tags, skipping...');
        }

        try {
            await queryInterface.removeColumn('task_tags', 'color');
        } catch (error) {
            console.log('Column color does not exist in task_tags, skipping...');
        }
    },

    async down(queryInterface, Sequelize) {
        // No need to restore these columns
    }
};
