'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create projects table
    await queryInterface.createTable('projects', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      workspace_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'workspaces',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      color: {
        type: Sequelize.STRING(7),
        allowNull: true,
        comment: 'Hex color code like #FF5733'
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: false
      },
      archived_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Soft archive timestamp'
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

    // Add indexes for projects
    await queryInterface.addIndex('projects', ['workspace_id']);
    await queryInterface.addIndex('projects', ['archived_at']);
    await queryInterface.addIndex('projects', ['created_at']);

    // 2. Create project_members table
    await queryInterface.createTable('project_members', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      workspace_member_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'workspace_members',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      project_role: {
        type: Sequelize.ENUM('lead', 'member', 'viewer'),
        allowNull: false,
        defaultValue: 'member'
      },
      added_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

    // Add indexes and unique constraint for project_members
    await queryInterface.addIndex('project_members', ['project_id']);
    await queryInterface.addIndex('project_members', ['workspace_member_id']);
    await queryInterface.addIndex('project_members', ['project_id', 'workspace_member_id'], {
      unique: true,
      name: 'unique_project_workspace_member'
    });

    // 3. Create task_statuses table (Kanban columns)
    await queryInterface.createTable('task_statuses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      color: {
        type: Sequelize.STRING(7),
        allowNull: true,
        defaultValue: '#94A3B8',
        comment: 'Hex color code for Kanban column'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Order of columns in Kanban board'
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Default status for new tasks'
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

    // Add indexes for task_statuses
    await queryInterface.addIndex('task_statuses', ['project_id']);
    await queryInterface.addIndex('task_statuses', ['project_id', 'position']);
    await queryInterface.addIndex('task_statuses', ['project_id', 'name'], {
      unique: true,
      name: 'unique_project_status_name'
    });

    // 4. Create project_labels table
    await queryInterface.createTable('project_labels', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      project_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      color: {
        type: Sequelize.STRING(7),
        allowNull: false,
        comment: 'Hex color code like #FF5733'
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

    // Add indexes for project_labels
    await queryInterface.addIndex('project_labels', ['project_id']);
    await queryInterface.addIndex('project_labels', ['project_id', 'name'], {
      unique: true,
      name: 'unique_project_label_name'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order (respecting foreign keys)
    await queryInterface.dropTable('project_labels');
    await queryInterface.dropTable('task_statuses');
    await queryInterface.dropTable('project_members');
    await queryInterface.dropTable('projects');
  }
};
