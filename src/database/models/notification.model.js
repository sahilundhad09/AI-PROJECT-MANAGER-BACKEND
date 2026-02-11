const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                isIn: [['task_assigned', 'task_due', 'comment_mention', 'workspace_invite', 'project_invite', 'project_invite_accepted', 'project_update']]
            }
        },
        title: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        meta: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
        is_read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'notifications',
        updatedAt: false,
        indexes: [
            { fields: ['user_id', 'is_read'] },
            { fields: ['created_at'] }
        ]
    });

    Notification.associate = (models) => {
        Notification.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return Notification;
};
