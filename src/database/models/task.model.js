const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Task = sequelize.define('Task', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        project_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'projects',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        status_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'task_statuses',
                key: 'id'
            }
        },
        title: {
            type: DataTypes.STRING(220),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        priority: {
            type: DataTypes.STRING(10),
            defaultValue: 'medium',
            validate: {
                isIn: [['low', 'medium', 'high', 'urgent']]
            }
        },
        task_type: {
            type: DataTypes.STRING(20),
            defaultValue: 'task',
            validate: {
                isIn: [['task', 'bug', 'story', 'epic']]
            }
        },
        due_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        estimated_hours: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: true
        },
        actual_hours: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: true
        },
        order_no: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        parent_task_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'tasks',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        is_archived: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'tasks',
        indexes: [
            { fields: ['project_id'] },
            { fields: ['status_id'] },
            { fields: ['priority'] },
            { fields: ['due_date'] },
            { fields: ['parent_task_id'] },
            { fields: ['created_by'] },
            { fields: ['is_archived'] }
        ]
    });

    Task.associate = (models) => {
        Task.belongsTo(models.Project, {
            foreignKey: 'project_id',
            as: 'project'
        });

        Task.belongsTo(models.TaskStatus, {
            foreignKey: 'status_id',
            as: 'status'
        });

        Task.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        });

        // Self-referencing for subtasks
        Task.belongsTo(models.Task, {
            foreignKey: 'parent_task_id',
            as: 'parentTask'
        });

        Task.hasMany(models.Task, {
            foreignKey: 'parent_task_id',
            as: 'subtasks'
        });

        Task.hasMany(models.TaskAssignee, {
            foreignKey: 'task_id',
            as: 'assignees'
        });

        Task.hasMany(models.Comment, {
            foreignKey: 'task_id',
            as: 'comments'
        });

        Task.hasMany(models.Attachment, {
            foreignKey: 'task_id',
            as: 'attachments'
        });

        Task.hasMany(models.TaskTagMap, {
            foreignKey: 'task_id',
            as: 'tagMappings'
        });

        // Task dependencies
        Task.hasMany(models.TaskDependency, {
            foreignKey: 'task_id',
            as: 'dependencies'
        });

        Task.hasMany(models.TaskDependency, {
            foreignKey: 'depends_on_task_id',
            as: 'dependents'
        });
    };

    return Task;
};
