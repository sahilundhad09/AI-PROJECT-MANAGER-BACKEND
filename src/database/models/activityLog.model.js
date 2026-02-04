const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ActivityLog = sequelize.define('ActivityLog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        workspace_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'workspaces',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        project_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'projects',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        task_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'tasks',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        actor_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        action: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        meta: {
            type: DataTypes.JSONB,
            defaultValue: {}
        }
    }, {
        tableName: 'activity_logs',
        updatedAt: false,
        indexes: [
            { fields: ['workspace_id', 'created_at'] },
            { fields: ['project_id', 'created_at'] },
            { fields: ['task_id', 'created_at'] },
            { fields: ['actor_id'] }
        ]
    });

    ActivityLog.associate = (models) => {
        ActivityLog.belongsTo(models.Workspace, {
            foreignKey: 'workspace_id',
            as: 'workspace'
        });

        ActivityLog.belongsTo(models.Project, {
            foreignKey: 'project_id',
            as: 'project'
        });

        ActivityLog.belongsTo(models.Task, {
            foreignKey: 'task_id',
            as: 'task'
        });

        ActivityLog.belongsTo(models.User, {
            foreignKey: 'actor_id',
            as: 'actor'
        });
    };

    return ActivityLog;
};
