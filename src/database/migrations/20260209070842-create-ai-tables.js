'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create ai_chat_sessions table
    await queryInterface.createTable('ai_chat_sessions', {
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
      project_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(150),
        defaultValue: 'New Chat'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for ai_chat_sessions
    await queryInterface.addIndex('ai_chat_sessions', ['workspace_id']);
    await queryInterface.addIndex('ai_chat_sessions', ['project_id']);
    await queryInterface.addIndex('ai_chat_sessions', ['created_by']);
    await queryInterface.addIndex('ai_chat_sessions', ['created_at']);

    // 2. Create ai_chat_messages table
    await queryInterface.createTable('ai_chat_messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ai_chat_sessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      tool_name: {
        type: Sequelize.STRING(80),
        allowNull: true
      },
      tool_payload: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for ai_chat_messages
    await queryInterface.addIndex('ai_chat_messages', ['session_id']);
    await queryInterface.addIndex('ai_chat_messages', ['created_at']);

    // 3. Create ai_task_generations table
    await queryInterface.createTable('ai_task_generations', {
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
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      prompt: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      generated_tasks: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      accepted_task_ids: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      tokens_used: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for ai_task_generations
    await queryInterface.addIndex('ai_task_generations', ['project_id']);
    await queryInterface.addIndex('ai_task_generations', ['created_by']);
    await queryInterface.addIndex('ai_task_generations', ['created_at']);

    // 4. Create ai_project_summaries table
    await queryInterface.createTable('ai_project_summaries', {
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
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      summary_type: {
        type: Sequelize.ENUM('daily', 'weekly', 'custom'),
        allowNull: false,
        defaultValue: 'custom'
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      date_range_start: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      date_range_end: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      tokens_used: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for ai_project_summaries
    await queryInterface.addIndex('ai_project_summaries', ['project_id']);
    await queryInterface.addIndex('ai_project_summaries', ['created_by']);
    await queryInterface.addIndex('ai_project_summaries', ['summary_type']);
    await queryInterface.addIndex('ai_project_summaries', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order (to handle foreign keys)
    await queryInterface.dropTable('ai_project_summaries');
    await queryInterface.dropTable('ai_task_generations');
    await queryInterface.dropTable('ai_chat_messages');
    await queryInterface.dropTable('ai_chat_sessions');
  }
};
