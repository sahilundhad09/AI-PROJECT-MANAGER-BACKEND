const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TaskStatus = sequelize.define('TaskStatus', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        project_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'projects',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        order_no: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'task_statuses',
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['project_id', 'name']
            },
            { fields: ['project_id', 'order_no'] }
        ]
    });

    TaskStatus.associate = (models) => {
        TaskStatus.belongsTo(models.Project, {
            foreignKey: 'project_id',
            as: 'project'
        });

        TaskStatus.hasMany(models.Task, {
            foreignKey: 'status_id',
            as: 'tasks'
        });
    };

    return TaskStatus;
};
