const chatService = require('./chat.service');

// Send chat message (non-streaming)
const sendMessage = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { message, session_id } = req.body;
        const userId = req.user.id;

        const result = await chatService.sendMessage(projectId, userId, message, session_id);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Send chat message with streaming (SSE)
const sendMessageStream = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { message, session_id } = req.body;
        const userId = req.user.id;

        // Set headers for Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

        // Send initial connection message
        res.write('data: {"type":"connected"}\n\n');

        let sessionId = session_id;
        let isFirst = true;

        try {
            for await (const data of chatService.sendMessageStream(projectId, userId, message, session_id)) {
                // Send session_id on first chunk
                if (isFirst) {
                    sessionId = data.session_id;
                    res.write(`data: ${JSON.stringify({ type: 'session', session_id: sessionId })}\n\n`);
                    isFirst = false;
                }

                // Send chunk
                res.write(`data: ${JSON.stringify({ type: 'chunk', content: data.chunk })}\n\n`);
            }

            // Send completion message
            res.write(`data: ${JSON.stringify({ type: 'done', session_id: sessionId })}\n\n`);
            res.end();
        } catch (streamError) {
            res.write(`data: ${JSON.stringify({ type: 'error', message: streamError.message })}\n\n`);
            res.end();
        }
    } catch (error) {
        // If error occurs before streaming starts
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
    }
};

// Get chat sessions
const getChatSessions = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const filters = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 20
        };

        const result = await chatService.getChatSessions(projectId, userId, filters);

        res.json({
            success: true,
            data: result.sessions,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

// Get session history
const getSessionHistory = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const result = await chatService.getSessionHistory(sessionId, userId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// Delete session
const deleteSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        await chatService.deleteSession(sessionId, userId);

        res.json({
            success: true,
            message: 'Chat session deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendMessage,
    sendMessageStream,
    getChatSessions,
    getSessionHistory,
    deleteSession
};
