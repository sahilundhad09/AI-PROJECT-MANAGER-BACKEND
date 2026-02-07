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
            },
            onDelete: 'RESTRICT'
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
            defaultValue: 'medium',
            allowNull: false
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
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        actual_hours: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        position: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        parent_task_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'tasks',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        completed_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        archived_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'tasks',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['project_id', 'status_id', 'position'] },
            { fields: ['project_id', 'archived_at'] },
            { fields: ['due_date'] },
            { fields: ['created_by'] },
            { fields: ['parent_task_id'] },
            { fields: ['priority'] }
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

        Task.hasMany(models.TaskTag, {
            foreignKey: 'task_id',
            as: 'tags'
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
