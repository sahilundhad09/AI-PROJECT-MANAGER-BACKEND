const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ProjectLabel = sequelize.define('ProjectLabel', {
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
        name: {
            type: DataTypes.STRING(60),
            allowNull: false
        },
        color: {
            type: DataTypes.STRING(30),
            defaultValue: '#3B82F6'
        }
    }, {
        tableName: 'project_labels',
        timestamps: false
    });

    ProjectLabel.associate = (models) => {
        ProjectLabel.belongsTo(models.Project, {
            foreignKey: 'project_id',
            as: 'project'
        });
    };

    return ProjectLabel;
};
