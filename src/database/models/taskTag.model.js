const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TaskTag = sequelize.define('TaskTag', {
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
            type: DataTypes.STRING(30),
            defaultValue: '#10B981'
        }
    }, {
        tableName: 'task_tags',
        timestamps: false,
        indexes: [
            {
                unique: true,
                fields: ['project_id', 'name']
            }
        ]
    });

    TaskTag.associate = (models) => {
        TaskTag.belongsTo(models.Project, {
            foreignKey: 'project_id',
            as: 'project'
        });

        TaskTag.hasMany(models.TaskTagMap, {
            foreignKey: 'tag_id',
            as: 'taskMappings'
        });
    };

    return TaskTag;
};
