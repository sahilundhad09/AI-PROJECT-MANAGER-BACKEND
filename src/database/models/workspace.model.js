const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Workspace = sequelize.define('Workspace', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        logo_url: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        settings: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'workspaces',
        timestamps: true,
        underscored: true,
        paranoid: false // We handle soft delete manually with deleted_at
    });


    Workspace.associate = (models) => {
        Workspace.hasMany(models.WorkspaceMember, {
            foreignKey: 'workspace_id',
            as: 'members'
        });

        Workspace.hasMany(models.Project, {
            foreignKey: 'workspace_id',
            as: 'projects'
        });

        Workspace.hasMany(models.WorkspaceInvitation, {
            foreignKey: 'workspace_id',
            as: 'invitations'
        });

        Workspace.hasMany(models.ActivityLog, {
            foreignKey: 'workspace_id',
            as: 'activityLogs'
        });
    };

    return Workspace;
};
