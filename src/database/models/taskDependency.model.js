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
        },
        dependency_type: {
            type: DataTypes.ENUM('blocks', 'blocked_by'),
            allowNull: false
        }
    }, {
        tableName: 'task_dependencies',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['task_id', 'depends_on_task_id', 'dependency_type']
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
