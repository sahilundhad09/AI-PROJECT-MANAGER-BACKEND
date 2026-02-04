const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AITaskGeneration = sequelize.define('AITaskGeneration', {
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
        prompt: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        output: {
            type: DataTypes.JSONB,
            allowNull: false
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        tableName: 'ai_task_generations',
        updatedAt: false,
        indexes: [
            { fields: ['project_id'] },
            { fields: ['created_by'] }
        ]
    });

    AITaskGeneration.associate = (models) => {
        AITaskGeneration.belongsTo(models.Project, {
            foreignKey: 'project_id',
            as: 'project'
        });

        AITaskGeneration.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        });
    };

    return AITaskGeneration;
};
