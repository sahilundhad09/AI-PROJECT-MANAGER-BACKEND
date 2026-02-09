const { AIChatSession, AIChatMessage, Project, Task, User, ProjectMember, WorkspaceMember } = require('../../database/models');
const groqService = require('../../shared/services/groq.service');

class ChatService {
    /**
     * Send chat message and get AI response
     */
    async sendMessage(projectId, userId, message, sessionId = null) {
        // Verify project access
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const workspaceMember = await WorkspaceMember.findOne({
            where: { user_id: userId, workspace_id: project.workspace_id }
        });

        if (!workspaceMember) {
            throw new Error('You do not have access to this project');
        }

        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                workspace_member_id: workspaceMember.id
            }
        });

        if (!projectMember) {
            throw new Error('You are not a member of this project');
        }

        // Get or create session
        let session;
        if (sessionId) {
            session = await AIChatSession.findOne({
                where: { id: sessionId, project_id: projectId }
            });
            if (!session) {
                throw new Error('Chat session not found');
            }
        } else {
            // Create new session
            session = await AIChatSession.create({
                workspace_id: project.workspace_id,
                project_id: projectId,
                created_by: userId,
                title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
            });
        }

        // Save user message
        const userMessage = await AIChatMessage.create({
            session_id: session.id,
            role: 'user',
            content: message
        });

        // Get conversation history
        const history = await AIChatMessage.findAll({
            where: { session_id: session.id },
            order: [['created_at', 'ASC']],
            limit: 20
        });

        // Build project context
        const tasks = await Task.findAll({
            where: { project_id: projectId },
            limit: 20,
            order: [['created_at', 'DESC']]
        });

        const members = await ProjectMember.findAll({
            where: { project_id: projectId },
            include: [
                {
                    model: WorkspaceMember,
                    as: 'workspaceMember',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                }
            ]
        });

        const projectContext = groqService.buildProjectContext(
            project,
            tasks,
            members.map(m => ({
                user: m.workspaceMember?.user,
                role: m.role
            }))
        );

        const conversationHistory = groqService.buildConversationHistory(
            history.slice(0, -1) // Exclude the current message
        );

        // Build prompt
        const prompt = `You are a helpful project management AI assistant.

Project Context:
${projectContext}

${conversationHistory ? `Conversation History:\n${conversationHistory}\n` : ''}
User: ${message}

Provide a helpful, concise response based on the project context. Be specific and actionable.`;

        // Generate AI response
        const aiResponse = await groqService.generateContent(prompt, {
            temperature: 0.7
        });

        // Save AI message
        const assistantMessage = await AIChatMessage.create({
            session_id: session.id,
            role: 'assistant',
            content: aiResponse.text,
            content: aiResponse.text
        });

        return {
            session_id: session.id,
            user_message: userMessage,
            ai_message: assistantMessage
        };
    }

    /**
     * Send message with streaming response
     */
    async* sendMessageStream(projectId, userId, message, sessionId = null) {
        // Verify project access
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const workspaceMember = await WorkspaceMember.findOne({
            where: { user_id: userId, workspace_id: project.workspace_id }
        });

        if (!workspaceMember) {
            throw new Error('You do not have access to this project');
        }

        const projectMember = await ProjectMember.findOne({
            where: {
                project_id: projectId,
                workspace_member_id: workspaceMember.id
            }
        });

        if (!projectMember) {
            throw new Error('You are not a member of this project');
        }

        // Get or create session
        let session;
        if (sessionId) {
            session = await AIChatSession.findOne({
                where: { id: sessionId, project_id: projectId }
            });
            if (!session) {
                throw new Error('Chat session not found');
            }
        } else {
            session = await AIChatSession.create({
                workspace_id: project.workspace_id,
                project_id: projectId,
                created_by: userId,
                title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
            });
        }

        // Save user message
        await AIChatMessage.create({
            session_id: session.id,
            role: 'user',
            content: message
        });

        // Get conversation history
        const history = await AIChatMessage.findAll({
            where: { session_id: session.id },
            order: [['created_at', 'ASC']],
            limit: 20
        });

        // Build context
        const tasks = await Task.findAll({
            where: { project_id: projectId },
            limit: 20,
            order: [['created_at', 'DESC']]
        });

        const members = await ProjectMember.findAll({
            where: { project_id: projectId },
            include: [
                {
                    model: WorkspaceMember,
                    as: 'workspaceMember',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                }
            ]
        });

        const projectContext = groqService.buildProjectContext(
            project,
            tasks,
            members.map(m => ({
                user: m.workspaceMember?.user,
                role: m.role
            }))
        );

        const conversationHistory = groqService.buildConversationHistory(
            history.slice(0, -1)
        );

        const prompt = `You are a helpful project management AI assistant.

Project Context:
${projectContext}

${conversationHistory ? `Conversation History:\n${conversationHistory}\n` : ''}
User: ${message}

Provide a helpful, concise response based on the project context. Be specific and actionable.`;

        // Stream response
        let fullResponse = '';
        for await (const chunk of groqService.generateContentStream(prompt, { temperature: 0.7 })) {
            fullResponse += chunk;
            yield { chunk, session_id: session.id };
        }

        // Save complete AI response
        await AIChatMessage.create({
            session_id: session.id,
            role: 'assistant',
            content: fullResponse,
            content: fullResponse
        });
    }

    /**
     * Get chat sessions for a project
     */
    async getChatSessions(projectId, userId, filters = {}) {
        const { page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;

        // Verify access
        const project = await Project.findByPk(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        const workspaceMember = await WorkspaceMember.findOne({
            where: { user_id: userId, workspace_id: project.workspace_id }
        });

        if (!workspaceMember) {
            throw new Error('You do not have access to this project');
        }

        const { count, rows: sessions } = await AIChatSession.findAndCountAll({
            where: { project_id: projectId },
            include: [
                {
                    model: AIChatMessage,
                    as: 'messages',
                    attributes: ['id', 'role', 'content', 'created_at'],
                    limit: 1,
                    order: [['created_at', 'DESC']]
                }
            ],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        return {
            sessions,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get session history
     */
    async getSessionHistory(sessionId, userId) {
        const session = await AIChatSession.findByPk(sessionId, {
            include: [
                {
                    model: Project,
                    as: 'project'
                }
            ]
        });

        if (!session) {
            throw new Error('Chat session not found');
        }

        // Verify access
        const workspaceMember = await WorkspaceMember.findOne({
            where: { user_id: userId, workspace_id: session.project.workspace_id }
        });

        if (!workspaceMember) {
            throw new Error('You do not have access to this chat');
        }

        const messages = await AIChatMessage.findAll({
            where: { session_id: sessionId },
            order: [['created_at', 'ASC']]
        });

        return {
            session,
            messages
        };
    }

    /**
     * Delete chat session
     */
    async deleteSession(sessionId, userId) {
        const session = await AIChatSession.findByPk(sessionId, {
            include: [
                {
                    model: Project,
                    as: 'project'
                }
            ]
        });

        if (!session) {
            throw new Error('Chat session not found');
        }

        // Only creator or admin can delete
        if (session.user_id !== userId) {
            throw new Error('You can only delete your own chat sessions');
        }

        await session.destroy();
    }
}

module.exports = new ChatService();
