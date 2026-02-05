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
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        color: {
            type: DataTypes.STRING(7),
            allowNull: true
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: true
        },
        settings: {
            type: DataTypes.JSONB,
            defaultValue: {},
            allowNull: false
        },
        archived_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'projects',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['workspace_id'] },
            { fields: ['archived_at'] },
            { fields: ['created_at'] }
        ]
    });


    Project.associate = (models) => {
        Project.belongsTo(models.Workspace, {
            foreignKey: 'workspace_id',
            as: 'workspace'
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
