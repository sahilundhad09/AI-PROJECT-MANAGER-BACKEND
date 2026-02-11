const { Sequelize } = require('sequelize');
const config = require('../../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: dbConfig.logging,
        pool: dbConfig.pool,
        define: dbConfig.define
    }
);

const db = {};

// Import models
db.User = require('./user.model')(sequelize);
db.RefreshToken = require('./refreshToken.model')(sequelize);
db.Workspace = require('./workspace.model')(sequelize);
db.WorkspaceMember = require('./workspaceMember.model')(sequelize);
db.WorkspaceInvitation = require('./workspaceInvitation.model')(sequelize);
db.Project = require('./project.model')(sequelize);
db.ProjectMember = require('./projectMember.model')(sequelize);
db.ProjectLabel = require('./projectLabel.model')(sequelize);
db.TaskStatus = require('./taskStatus.model')(sequelize);
db.Task = require('./task.model')(sequelize);
db.TaskAssignee = require('./taskAssignee.model')(sequelize);
db.TaskTag = require('./taskTag.model')(sequelize);
db.TaskDependency = require('./taskDependency.model')(sequelize);
db.Comment = require('./comment.model')(sequelize);
db.Attachment = require('./attachment.model')(sequelize);
db.ActivityLog = require('./activityLog.model')(sequelize);
db.Notification = require('./notification.model')(sequelize);
db.AIChatSession = require('./aiChatSession.model')(sequelize);
db.AIChatMessage = require('./aiChatMessage.model')(sequelize);
db.AITaskGeneration = require('./aiTaskGeneration.model')(sequelize);
db.AIProjectSummary = require('./aiProjectSummary.model')(sequelize);
db.AIToolLog = require('./aiToolLog.model')(sequelize);
db.ProjectInvitation = require('./projectInvitation.model')(sequelize);

// Define associations
Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
