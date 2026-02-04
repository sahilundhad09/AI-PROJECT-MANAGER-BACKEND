const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Project = sequelize.define('Project', {
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
        name: {
            type: DataTypes.STRING(180),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'active',
            validate: {
                isIn: [['active', 'on_hold', 'completed', 'cancelled']]
            }
        },
        priority: {
            type: DataTypes.STRING(10),
            defaultValue: 'medium',
            validate: {
                isIn: [['low', 'medium', 'high', 'urgent']]
            }
        },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        due_date: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        archived_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'projects',
        indexes: [
            { fields: ['workspace_id'] },
            { fields: ['status'] },
            { fields: ['created_by'] },
            { fields: ['due_date'] }
        ]
    });

    Project.associate = (models) => {
        Project.belongsTo(models.Workspace, {
            foreignKey: 'workspace_id',
            as: 'workspace'
        });

        Project.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        });

        Project.hasMany(models.ProjectMember, {
            foreignKey: 'project_id',
            as: 'members'
        });

        Project.hasMany(models.Task, {
            foreignKey: 'project_id',
            as: 'tasks'
        });

        Project.hasMany(models.TaskStatus, {
            foreignKey: 'project_id',
            as: 'taskStatuses'
        });

        Project.hasMany(models.ProjectLabel, {
            foreignKey: 'project_id',
            as: 'labels'
        });

        Project.hasMany(models.TaskTag, {
            foreignKey: 'project_id',
            as: 'tags'
        });
    };

    return Project;
};
