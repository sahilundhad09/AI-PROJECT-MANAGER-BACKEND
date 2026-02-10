'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('notifications', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            type: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            title: {
                type: Sequelize.STRING(150),
                allowNull: false
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            meta: {
                type: Sequelize.JSONB,
                defaultValue: {}
            },
            is_read: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add indexes
        await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
        await queryInterface.addIndex('notifications', ['created_at']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('notifications');
    }
};
