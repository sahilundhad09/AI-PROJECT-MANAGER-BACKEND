const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const RefreshToken = sequelize.define('RefreshToken', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
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
        token: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        revoked_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'refresh_tokens',
        updatedAt: false,
        indexes: [
            { fields: ['user_id'] },
            { fields: ['token'] },
            { fields: ['expires_at'] }
        ]
    });

    RefreshToken.associate = (models) => {
        RefreshToken.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return RefreshToken;
};
