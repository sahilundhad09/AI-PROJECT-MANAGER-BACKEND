const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AIChatMessage = sequelize.define('AIChatMessage', {
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
        role: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [['user', 'assistant', 'tool', 'system']]
            }
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        tool_name: {
            type: DataTypes.STRING(80),
            allowNull: true
        },
        tool_payload: {
            type: DataTypes.JSONB,
            allowNull: true
        }
    }, {
        tableName: 'ai_chat_messages',
        updatedAt: false,
        indexes: [
            { fields: ['session_id', 'created_at'] }
        ]
    });

    AIChatMessage.associate = (models) => {
        AIChatMessage.belongsTo(models.AIChatSession, {
            foreignKey: 'session_id',
            as: 'session'
        });
    };

    return AIChatMessage;
};
