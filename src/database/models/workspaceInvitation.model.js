const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WorkspaceInvitation = sequelize.define('WorkspaceInvitation', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        workspace_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'workspaces',
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
        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        role: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [['admin', 'manager', 'member']]
            }
        },
        token: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'pending',
            validate: {
                isIn: [['pending', 'accepted', 'rejected', 'expired']]
            }
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        accepted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'workspace_invitations',
        indexes: [
            { fields: ['workspace_id'] },
            { fields: ['email'] },
            { fields: ['token'] },
            { fields: ['status'] }
        ]
    });

    WorkspaceInvitation.associate = (models) => {
        WorkspaceInvitation.belongsTo(models.Workspace, {
            foreignKey: 'workspace_id',
            as: 'workspace'
        });

        WorkspaceInvitation.belongsTo(models.User, {
            foreignKey: 'invited_by',
            as: 'inviter'
        });
    };

    return WorkspaceInvitation;
};
