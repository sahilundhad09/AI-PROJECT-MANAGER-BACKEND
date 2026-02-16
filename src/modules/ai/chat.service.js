const { AIChatSession, AIChatMessage, Project, Task, User, ProjectMember, WorkspaceMember, TaskAssignee, TaskStatus } = require('../../database/models');
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

        // Define tools for the AI
        const tools = [
            {
                type: 'function',
                function: {
                    name: 'create_task',
                    description: 'Create a new task in the project with optional auto-assignment.',
                    parameters: {
                        type: 'object',
                        properties: {
                            title: { type: 'string', description: 'Task title' },
                            description: { type: 'string', description: 'Detailed task description' },
                            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Task priority' },
                            assignee: { type: 'string', description: 'Name of the team member to assign this task to' }
                        },
                        required: ['title', 'priority']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'update_task',
                    description: 'Update an existing task in the project (e.g., assign to someone, change status).',
                    parameters: {
                        type: 'object',
                        properties: {
                            task_id: { type: 'string', description: 'ID of the task to update' },
                            title: { type: 'string', description: 'Title of the task (if ID is unknown)' },
                            status: { type: 'string', description: 'New status name (e.g., "In Progress", "Done")' },
                            assignee: { type: 'string', description: 'Name of the member to assign' }
                        }
                    }
                }
            }
        ];

        // Build prompt
        const systemInstruction = `You are a professional project management AI assistant.
        
CRITICAL RULES:
1. ONLY use 'create_task' if the user explicitly asks to create a task.
2. ONLY use 'update_task' if the user explicitly asks to assign someone, change a status, or update task details.
3. If the user just says "hii", "hello", or asks a general question, ONLY respond with text. DO NOT CALL ANY TOOLS.
4. When creating tasks, describe them based on project context if possible.
5. Be concise and actionable.`;

        const prompt = `Project Context:
${projectContext}

${conversationHistory ? `Conversation History:\n${conversationHistory}\n` : ''}
User Message: ${message}

Action: Decide if a tool call is strictly necessary based on the User Message. If not, respond with text only.`;

        // Generate AI response
        const aiResponse = await groqService.generateContent(prompt, {
            systemInstruction,
            temperature: 0.3,
            tools: tools
        });

        const taskService = require('../task/task.service');

        // Handle Tool Calls
        if (aiResponse.toolCalls) {
            for (const toolCall of aiResponse.toolCalls) {
                if (toolCall.function.name === 'create_task') {
                    const args = JSON.parse(toolCall.function.arguments);

                    // Resolve suggested assignee if provided
                    let assignee_ids = [];
                    if (args.assignee) {
                        const member = members.find(m =>
                            m.workspaceMember?.user?.name?.toLowerCase().includes(args.assignee.toLowerCase())
                        );
                        if (member) assignee_ids.push(member.id);
                    }

                    // Create the task using unified TaskService
                    const task = await taskService.createTask(projectId, userId, {
                        title: args.title,
                        description: args.description || '',
                        priority: args.priority || 'medium',
                        assignee_ids
                    });

                    let assignmentMsg = assignee_ids.length > 0 ? ` and assigned to ${args.assignee}` : '';
                    aiResponse.text = `I've created the task: "${args.title}"${assignmentMsg}. It's currently in the To Do column.`;
                    if (assignee_ids.length > 0) {
                        aiResponse.text = `I've created the task: "${args.title}"${assignmentMsg}. Since it's assigned, I've moved it to In Progress.`;
                    }
                } else if (toolCall.function.name === 'update_task') {
                    const args = JSON.parse(toolCall.function.arguments);
                    let task = null;

                    if (args.task_id) {
                        task = await Task.findByPk(args.task_id);
                    } else if (args.title) {
                        task = await Task.findOne({
                            where: { project_id: projectId, title: args.title }
                        });
                    }

                    if (!task) {
                        aiResponse.text = `I couldn't find the task "${args.title || args.task_id}" to update.`;
                        continue;
                    }

                    let updateData = {};
                    let feedback = [];

                    if (args.status) {
                        const status = await TaskStatus.findOne({
                            where: { project_id: projectId, name: args.status }
                        });
                        if (status) {
                            updateData.status_id = status.id;
                            feedback.push(`status changed to ${status.name}`);
                        }
                    }

                    // Perform update using unified TaskService
                    await taskService.updateTask(task.id, userId, updateData);

                    // Handle assignment separately using unified TaskService
                    if (args.assignee) {
                        const member = members.find(m =>
                            m.workspaceMember?.user?.name?.toLowerCase().includes(args.assignee.toLowerCase())
                        );

                        if (member) {
                            await taskService.assignMembers(task.id, [member.id], userId);
                            feedback.push(`assigned to ${member.workspaceMember.user.name}`);
                        }
                    }

                    aiResponse.text = `I've updated the task "${task.title}": ${feedback.join(', ')}.`;
                }
            }
        }

        // Save AI message
        const assistantMessage = await AIChatMessage.create({
            session_id: session.id,
            role: 'assistant',
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

        // Define tools for the AI
        const tools = [
            {
                type: 'function',
                function: {
                    name: 'create_task',
                    description: 'Create a new task in the project with optional auto-assignment.',
                    parameters: {
                        type: 'object',
                        properties: {
                            title: { type: 'string', description: 'Task title' },
                            description: { type: 'string', description: 'Detailed task description' },
                            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Task priority' },
                            assignee: { type: 'string', description: 'Name of the team member to assign this task to' }
                        },
                        required: ['title', 'priority']
                    }
                }
            },
            {
                type: 'function',
                function: {
                    name: 'update_task',
                    description: 'Update an existing task in the project (e.g., assign to someone, change status).',
                    parameters: {
                        type: 'object',
                        properties: {
                            task_id: { type: 'string', description: 'ID of the task to update' },
                            title: { type: 'string', description: 'Title of the task (if ID is unknown)' },
                            status: { type: 'string', description: 'New status name (e.g., "In Progress", "Done")' },
                            assignee: { type: 'string', description: 'Name of the member to assign' }
                        }
                    }
                }
            }
        ];

        const systemInstruction = `You are a professional project management AI assistant.
        
CRITICAL RULES:
1. ONLY use 'create_task' if the user explicitly asks to create a task.
2. ONLY use 'update_task' if the user explicitly asks to assign someone, change a status, or update task details.
3. If the user just says "hii", "hello", or asks a general question, ONLY respond with text. DO NOT CALL ANY TOOLS.
4. When creating tasks, describe them based on project context if possible.
5. Be concise and actionable.`;

        const prompt = `Project Context:
${projectContext}

${conversationHistory ? `Conversation History:\n${conversationHistory}\n` : ''}
User Message: ${message}

Action: Decide if a tool call is strictly necessary based on the User Message. If not, respond with text only.`;

        // Stream response
        let fullResponse = '';
        let toolCalls = [];
        const streamConfig = {
            temperature: 0.7,
            tools: tools
        };

        const taskService = require('../task/task.service');

        for await (const data of groqService.generateContentStream(prompt, streamConfig)) {
            if (data.type === 'text') {
                fullResponse += data.content;
                yield { chunk: data.content, session_id: session.id };
            } else if (data.type === 'tool_calls') {
                toolCalls = data.content;
            }
        }

        // Handle Tool Calls in Streaming mode
        if (toolCalls && toolCalls.length > 0) {
            let toolFeedback = [];
            for (const toolCall of toolCalls) {
                if (toolCall.function.name === 'create_task') {
                    const args = JSON.parse(toolCall.function.arguments);
                    let assignee_ids = [];
                    if (args.assignee) {
                        const member = members.find(m =>
                            m.workspaceMember?.user?.name?.toLowerCase().includes(args.assignee.toLowerCase())
                        );
                        if (member) assignee_ids.push(member.id);
                    }

                    const task = await taskService.createTask(projectId, userId, {
                        title: args.title,
                        description: args.description || '',
                        priority: args.priority || 'medium',
                        assignee_ids
                    });

                    let msg = `Created task: "${args.title}"`;
                    if (assignee_ids.length > 0) msg += ` and assigned to ${args.assignee}`;
                    toolFeedback.push(msg);
                } else if (toolCall.function.name === 'update_task') {
                    const args = JSON.parse(toolCall.function.arguments);
                    let task = null;
                    if (args.task_id) {
                        task = await Task.findByPk(args.task_id);
                    } else if (args.title) {
                        task = await Task.findOne({
                            where: { project_id: projectId, title: args.title }
                        });
                    }

                    if (task) {
                        let updateData = {};
                        let feedback = [];
                        if (args.status) {
                            const status = await TaskStatus.findOne({
                                where: { project_id: projectId, name: args.status }
                            });
                            if (status) {
                                updateData.status_id = status.id;
                                feedback.push(`changed status to ${status.name}`);
                            }
                        }
                        await taskService.updateTask(task.id, userId, updateData);

                        if (args.assignee) {
                            const member = members.find(m =>
                                m.workspaceMember?.user?.name?.toLowerCase().includes(args.assignee.toLowerCase())
                            );
                            if (member) {
                                await taskService.assignMembers(task.id, [member.id], userId);
                                feedback.push(`assigned to ${member.workspaceMember.user.name}`);
                            }
                        }
                        toolFeedback.push(`Updated task "${task.title}": ${feedback.join(', ')}`);
                    }
                }
            }

            if (toolFeedback.length > 0) {
                const feedbackMsg = `\n\n[Action System]: ${toolFeedback.join('; ')}`;
                fullResponse += feedbackMsg;
                yield { chunk: feedbackMsg, session_id: session.id };
            }
        }

        // Save complete AI response
        await AIChatMessage.create({
            session_id: session.id,
            role: 'assistant',
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
