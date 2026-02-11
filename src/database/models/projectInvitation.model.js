const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProjectInvitation = sequelize.define('ProjectInvitation', {
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
        invited_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        role: {
            type: DataTypes.STRING(20),
            defaultValue: 'member',
            validate: {
                isIn: [['lead', 'member', 'viewer']]
            }
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'pending',
            validate: {
                isIn: [['pending', 'accepted', 'rejected', 'expired']]
            }
        },
        accepted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'project_invitations',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['project_id'] },
            { fields: ['workspace_member_id'] },
            { fields: ['status'] }
        ]
    });

    ProjectInvitation.associate = (models) => {
        ProjectInvitation.belongsTo(models.Project, {
            foreignKey: 'project_id',
            as: 'project'
        });

        ProjectInvitation.belongsTo(models.WorkspaceMember, {
            foreignKey: 'workspace_member_id',
            as: 'invitee'
        });

        ProjectInvitation.belongsTo(models.User, {
            foreignKey: 'invited_by',
            as: 'inviter'
        });
    };

    return ProjectInvitation;
};
