'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create users table
        await queryInterface.createTable('users', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            name: {
                type: Sequelize.STRING(120),
                allowNull: false
            },
            email: {
                type: Sequelize.STRING(150),
                allowNull: false,
                unique: true
            },
            password_hash: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            avatar_url: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            phone: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            is_verified: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            last_login_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            status: {
                type: Sequelize.STRING(20),
                defaultValue: 'active'
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add indexes for users
        await queryInterface.addIndex('users', ['email']);
        await queryInterface.addIndex('users', ['status']);

        // Create refresh_tokens table
        await queryInterface.createTable('refresh_tokens', {
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
            token: {
                type: Sequelize.TEXT,
                allowNull: false,
                unique: true
            },
            expires_at: {
                type: Sequelize.DATE,
                allowNull: false
            },
            revoked_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        await queryInterface.addIndex('refresh_tokens', ['user_id']);
        await queryInterface.addIndex('refresh_tokens', ['token']);

        console.log('✅ Initial migration completed successfully');
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('refresh_tokens');
        await queryInterface.dropTable('users');
    }
};
