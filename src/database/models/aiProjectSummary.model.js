const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AIProjectSummary = sequelize.define('AIProjectSummary', {
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
        summary_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                isIn: [['daily', 'weekly', 'sprint', 'on_demand']]
            }
        },
        summary: {
            type: DataTypes.TEXT,
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
        tableName: 'ai_project_summaries',
        updatedAt: false,
        indexes: [
            { fields: ['project_id', 'created_at'] },
            { fields: ['summary_type'] }
        ]
    });

    AIProjectSummary.associate = (models) => {
        AIProjectSummary.belongsTo(models.Project, {
            foreignKey: 'project_id',
            as: 'project'
        });

        AIProjectSummary.belongsTo(models.User, {
            foreignKey: 'created_by',
            as: 'creator'
        });
    };

    return AIProjectSummary;
};
