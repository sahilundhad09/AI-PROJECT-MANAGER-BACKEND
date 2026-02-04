const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Workspace = sequelize.define('Workspace', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(160),
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING(120),
            allowNull: false,
            unique: true
        },
        owner_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        plan: {
            type: DataTypes.STRING(50),
            defaultValue: 'free',
            validate: {
                isIn: [['free', 'pro', 'enterprise']]
            }
        },
        logo_url: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        settings: {
            type: DataTypes.JSONB,
            defaultValue: {}
        }
    }, {
        tableName: 'workspaces',
        indexes: [
            { fields: ['slug'] },
            { fields: ['owner_id'] }
        ]
    });

    Workspace.associate = (models) => {
        Workspace.belongsTo(models.User, {
            foreignKey: 'owner_id',
            as: 'owner'
        });

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
