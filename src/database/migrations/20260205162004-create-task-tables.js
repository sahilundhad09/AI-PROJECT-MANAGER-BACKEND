'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create tasks table
    await queryInterface.createTable('tasks', {
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
        onDelete: 'CASCADE'
      },
      status_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'task_statuses',
          key: 'id'
        },
        onDelete: 'RESTRICT'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium',
        allowNull: false
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      estimated_hours: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      actual_hours: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      parent_task_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      archived_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    // 2. Create task_assignees table (junction table)
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

    // 3. Create task_dependencies table (self-referencing)
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

    // 4. Create task_tags table (junction table)
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

    // Add indexes for performance
    // Tasks indexes
    await queryInterface.addIndex('tasks', ['project_id', 'status_id', 'position'], {
      name: 'tasks_project_status_position_idx'
    });
    await queryInterface.addIndex('tasks', ['project_id', 'archived_at'], {
      name: 'tasks_project_archived_idx'
    });
    await queryInterface.addIndex('tasks', ['due_date'], {
      name: 'tasks_due_date_idx'
    });
    await queryInterface.addIndex('tasks', ['created_by'], {
      name: 'tasks_created_by_idx'
    });
    await queryInterface.addIndex('tasks', ['parent_task_id'], {
      name: 'tasks_parent_task_idx'
    });
    await queryInterface.addIndex('tasks', ['priority'], {
      name: 'tasks_priority_idx'
    });

    // Task assignees indexes
    await queryInterface.addIndex('task_assignees', ['task_id'], {
      name: 'task_assignees_task_idx'
    });
    await queryInterface.addIndex('task_assignees', ['project_member_id'], {
      name: 'task_assignees_member_idx'
    });
    // Unique constraint to prevent duplicate assignments
    await queryInterface.addIndex('task_assignees', ['task_id', 'project_member_id'], {
      unique: true,
      name: 'task_assignees_unique_idx'
    });

    // Task dependencies indexes
    await queryInterface.addIndex('task_dependencies', ['task_id'], {
      name: 'task_dependencies_task_idx'
    });
    await queryInterface.addIndex('task_dependencies', ['depends_on_task_id'], {
      name: 'task_dependencies_depends_on_idx'
    });
    // Unique constraint to prevent duplicate dependencies
    await queryInterface.addIndex('task_dependencies', ['task_id', 'depends_on_task_id', 'dependency_type'], {
      unique: true,
      name: 'task_dependencies_unique_idx'
    });

    // Task tags indexes
    await queryInterface.addIndex('task_tags', ['task_id'], {
      name: 'task_tags_task_idx'
    });
    await queryInterface.addIndex('task_tags', ['label_id'], {
      name: 'task_tags_label_idx'
    });
    // Unique constraint to prevent duplicate tags
    await queryInterface.addIndex('task_tags', ['task_id', 'label_id'], {
      unique: true,
      name: 'task_tags_unique_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order (to handle foreign keys)
    await queryInterface.dropTable('task_tags');
    await queryInterface.dropTable('task_dependencies');
    await queryInterface.dropTable('task_assignees');
    await queryInterface.dropTable('tasks');

    // Drop ENUMs
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tasks_priority";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_task_dependencies_dependency_type";');
  }
};
