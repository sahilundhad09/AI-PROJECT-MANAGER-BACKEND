'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop existing tables
    await queryInterface.dropTable('task_tags');
    await queryInterface.dropTable('task_dependencies');
    await queryInterface.dropTable('task_assignees');

    // Recreate task_assignees with correct schema
    await queryInterface.createTable('task_assignees', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      project_member_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'project_members',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      assigned_at: {
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

    // Recreate task_dependencies with correct schema
    await queryInterface.createTable('task_dependencies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      depends_on_task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      dependency_type: {
        type: Sequelize.ENUM('blocks', 'blocked_by'),
        allowNull: false
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

    // Recreate task_tags with correct schema
    await queryInterface.createTable('task_tags', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      label_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'project_labels',
          key: 'id'
        },
        onDelete: 'CASCADE'
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

    // Add indexes
    await queryInterface.addIndex('task_assignees', ['task_id']);
    await queryInterface.addIndex('task_assignees', ['project_member_id']);
    await queryInterface.addIndex('task_assignees', ['task_id', 'project_member_id'], {
      unique: true,
      name: 'task_assignees_unique_idx'
    });

    await queryInterface.addIndex('task_dependencies', ['task_id']);
    await queryInterface.addIndex('task_dependencies', ['depends_on_task_id']);
    await queryInterface.addIndex('task_dependencies', ['task_id', 'depends_on_task_id', 'dependency_type'], {
      unique: true,
      name: 'task_dependencies_unique_idx'
    });

    await queryInterface.addIndex('task_tags', ['task_id']);
    await queryInterface.addIndex('task_tags', ['label_id']);
    await queryInterface.addIndex('task_tags', ['task_id', 'label_id'], {
      unique: true,
      name: 'task_tags_unique_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('task_tags');
    await queryInterface.dropTable('task_dependencies');
    await queryInterface.dropTable('task_assignees');
  }
};
