const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TaskDependency = sequelize.define('TaskDependency', {
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
        depends_on_task_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'tasks',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    }, {
        tableName: 'task_dependencies',
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['task_id', 'depends_on_task_id']
            },
            { fields: ['task_id'] },
            { fields: ['depends_on_task_id'] }
        ]
    });

    TaskDependency.associate = (models) => {
        TaskDependency.belongsTo(models.Task, {
            foreignKey: 'task_id',
            as: 'task'
        });

        TaskDependency.belongsTo(models.Task, {
            foreignKey: 'depends_on_task_id',
            as: 'dependsOnTask'
        });
    };

    return TaskDependency;
};
