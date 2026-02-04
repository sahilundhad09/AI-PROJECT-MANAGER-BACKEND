const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Attachment = sequelize.define('Attachment', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        task_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'tasks',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        uploaded_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        file_url: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        file_name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        file_size: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        mime_type: {
            type: DataTypes.STRING(100),
            allowNull: true
        }
    }, {
        tableName: 'attachments',
        updatedAt: false,
        indexes: [
            { fields: ['task_id'] },
            { fields: ['uploaded_by'] }
        ]
    });

    Attachment.associate = (models) => {
        Attachment.belongsTo(models.Task, {
            foreignKey: 'task_id',
            as: 'task'
        });

        Attachment.belongsTo(models.User, {
            foreignKey: 'uploaded_by',
            as: 'uploader'
        });
    };

    return Attachment;
};
