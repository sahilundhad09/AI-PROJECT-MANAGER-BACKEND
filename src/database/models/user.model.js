const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(120),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password_hash: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        avatar_url: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        last_login_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: {
            type: DataTypes.STRING(20),
            defaultValue: 'active',
            validate: {
                isIn: [['active', 'inactive', 'suspended']]
            }
        }
    }, {
        tableName: 'users',
        indexes: [
            { fields: ['email'] },
            { fields: ['status'] }
        ]
    });

    User.associate = (models) => {
        // User has many refresh tokens
        User.hasMany(models.RefreshToken, {
            foreignKey: 'user_id',
            as: 'refreshTokens'
        });

        // User has many workspace memberships
        User.hasMany(models.WorkspaceMember, {
            foreignKey: 'user_id',
            as: 'workspaceMemberships'
        });

        // User has many task assignments
        User.hasMany(models.TaskAssignee, {
            foreignKey: 'user_id',
            as: 'taskAssignments'
        });

        // User has many comments
        User.hasMany(models.Comment, {
            foreignKey: 'user_id',
            as: 'comments'
        });

        // User has many notifications
        User.hasMany(models.Notification, {
            foreignKey: 'user_id',
            as: 'notifications'
        });
    };

    return User;
};
