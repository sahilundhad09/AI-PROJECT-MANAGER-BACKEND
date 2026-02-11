'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('project_invitations', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      workspace_member_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'workspace_members',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      invited_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      role: {
        type: Sequelize.STRING(20),
        defaultValue: 'member'
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'pending'
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('project_invitations', ['project_id']);
    await queryInterface.addIndex('project_invitations', ['workspace_member_id']);
    await queryInterface.addIndex('project_invitations', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('project_invitations');
  }
};
