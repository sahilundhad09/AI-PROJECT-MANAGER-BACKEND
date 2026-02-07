const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TaskAssignee = sequelize.define('TaskAssignee', {
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
        project_member_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'project_members',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        assigned_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'task_assignees',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['task_id', 'project_member_id']
            },
            { fields: ['task_id'] },
            { fields: ['project_member_id'] }
        ]
    });

    TaskAssignee.associate = (models) => {
        TaskAssignee.belongsTo(models.Task, {
            foreignKey: 'task_id',
            as: 'task'
        });

        TaskAssignee.belongsTo(models.ProjectMember, {
            foreignKey: 'project_member_id',
            as: 'projectMember'
        });
    };

    return TaskAssignee;
};
