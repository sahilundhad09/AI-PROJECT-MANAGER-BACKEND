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
        color: {
            type: DataTypes.STRING(7),
            allowNull: true,
            defaultValue: '#94A3B8'
        },
        position: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        is_completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'task_statuses',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['project_id', 'name']
            },
            { fields: ['project_id', 'position'] }
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
