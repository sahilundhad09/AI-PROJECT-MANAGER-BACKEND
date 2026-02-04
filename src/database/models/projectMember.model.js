const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProjectMember = sequelize.define('ProjectMember', {
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
        workspace_member_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'workspace_members',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        project_role: {
            type: DataTypes.STRING(20),
            defaultValue: 'member',
            validate: {
                isIn: [['lead', 'member', 'viewer']]
            }
        },
        added_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'project_members',
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['project_id', 'workspace_member_id']
            },
            { fields: ['project_id'] },
            { fields: ['workspace_member_id'] }
        ]
    });

    ProjectMember.associate = (models) => {
        ProjectMember.belongsTo(models.Project, {
            foreignKey: 'project_id',
            as: 'project'
        });

        ProjectMember.belongsTo(models.WorkspaceMember, {
            foreignKey: 'workspace_member_id',
            as: 'workspaceMember'
        });
    };

    return ProjectMember;
};
