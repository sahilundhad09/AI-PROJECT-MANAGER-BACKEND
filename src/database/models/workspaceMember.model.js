const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WorkspaceMember = sequelize.define('WorkspaceMember', {
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
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        role: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: [['owner', 'admin', 'manager', 'member']]
            }
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'active',
            validate: {
                isIn: [['active', 'inactive']]
            }
        },
        joined_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'workspace_members',
        indexes: [
            {
                unique: true,
                fields: ['workspace_id', 'user_id']
            },
            { fields: ['workspace_id'] },
            { fields: ['user_id'] }
        ]
    });

    WorkspaceMember.associate = (models) => {
        WorkspaceMember.belongsTo(models.Workspace, {
            foreignKey: 'workspace_id',
            as: 'workspace'
        });

        WorkspaceMember.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });

        WorkspaceMember.hasMany(models.ProjectMember, {
            foreignKey: 'workspace_member_id',
            as: 'projectMemberships'
        });
    };

    return WorkspaceMember;
};
