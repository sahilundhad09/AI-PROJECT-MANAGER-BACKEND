const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Comment = sequelize.define('Comment', {
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
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        parent_comment_id: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'comments',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    }, {
        tableName: 'comments',
        updatedAt: false,
        indexes: [
            { fields: ['task_id'] },
            { fields: ['user_id'] },
            { fields: ['parent_comment_id'] }
        ]
    });

    Comment.associate = (models) => {
        Comment.belongsTo(models.Task, {
            foreignKey: 'task_id',
            as: 'task'
        });

        Comment.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });

        // Self-referencing for threaded comments
        Comment.belongsTo(models.Comment, {
            foreignKey: 'parent_comment_id',
            as: 'parentComment'
        });

        Comment.hasMany(models.Comment, {
            foreignKey: 'parent_comment_id',
            as: 'replies'
        });
    };

    return Comment;
};
