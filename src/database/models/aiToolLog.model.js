const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AIToolLog = sequelize.define('AIToolLog', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        session_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'ai_chat_sessions',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        tool_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        input: {
            type: DataTypes.JSONB,
            allowNull: false
        },
        output: {
            type: DataTypes.JSONB,
            allowNull: true
        },
        success: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'ai_tool_logs',
        updatedAt: false,
        indexes: [
            { fields: ['session_id', 'created_at'] },
            { fields: ['tool_name'] }
        ]
    });

    AIToolLog.associate = (models) => {
        AIToolLog.belongsTo(models.AIChatSession, {
            foreignKey: 'session_id',
            as: 'session'
        });
    };

    return AIToolLog;
};
