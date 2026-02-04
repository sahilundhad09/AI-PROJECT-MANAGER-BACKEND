const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TaskTagMap = sequelize.define('TaskTagMap', {
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
        tag_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'task_tags',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    }, {
        tableName: 'task_tag_map',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['task_id', 'tag_id']
            },
            { fields: ['task_id'] },
            { fields: ['tag_id'] }
        ]
    });

    TaskTagMap.associate = (models) => {
        TaskTagMap.belongsTo(models.Task, {
            foreignKey: 'task_id',
            as: 'task'
        });

        TaskTagMap.belongsTo(models.TaskTag, {
            foreignKey: 'tag_id',
            as: 'tag'
        });
    };

    return TaskTagMap;
};
