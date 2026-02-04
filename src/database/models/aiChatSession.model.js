const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AIChatSession = sequelize.define('AIChatSession', {
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
        created_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        title: {
            type: DataTypes.STRING(150),
            defaultValue: 'New Chat'
        }
    }, {
        tableName: 'ai_chat_sessions',
        updatedAt: false,
        indexes: [
            { fields: ['workspace_id'] },
            { fields: ['project_id'] },
            { fields: ['created_by'] }
        ]
    });

    AIChatSession.associate = (models) => {
        AIChatSession.belongsTo(models.Workspace, {
            foreignKey: 'workspace_id',
            as: 'workspace'
        });

        AIChatSession.belongsTo(models.Project, {
            foreignKey: 'project_id',
            as: 'project'
        });

        AIChatSession.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        });

        AIChatSession.hasMany(models.AIChatMessage, {
            foreignKey: 'session_id',
            as: 'messages'
        });

        AIChatSession.hasMany(models.AIToolLog, {
            foreignKey: 'session_id',
            as: 'toolLogs'
        });
    };

    return AIChatSession;
};
