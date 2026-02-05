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
            type: DataTypes.ENUM('owner', 'admin', 'member'),
            allowNull: false,
            defaultValue: 'member'
        },
        joined_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'workspace_members',
        timestamps: true,
        underscored: true,
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
