const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TaskTag = sequelize.define('TaskTag', {
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
        label_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'project_labels',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    }, {
        tableName: 'task_tags',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['task_id', 'label_id']
            },
            { fields: ['task_id'] },
            { fields: ['label_id'] }
        ]
    });

    TaskTag.associate = (models) => {
        TaskTag.belongsTo(models.Task, {
            foreignKey: 'task_id',
            as: 'task'
        });

        TaskTag.belongsTo(models.ProjectLabel, {
            foreignKey: 'label_id',
            as: 'label'
        });
    };

    return TaskTag;
};
