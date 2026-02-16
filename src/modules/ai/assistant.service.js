const { Task, AIToolLog } = require('../../database/models');
const groqService = require('../../shared/services/groq.service');

class AIAssistantService {
    /**
     * Expand a brief task into a detailed description
     */
    async detailTask(projectId, userId, taskData) {
        const { title, currentDescription } = taskData;

        const prompt = `You are a project management expert. Expand the following task into a detailed, professional project description.
        
Task Title: ${title}
Current Description: ${currentDescription || 'None'}

Please provide:
1. A comprehensive 3-4 sentence project-oriented description.
2. A list of 4-5 specific "Technical Requirements" or "Acceptance Criteria" as bullet points.

Format:
Return the result in clear markdown. Do not include the title in your response.

Response:`;

        const aiResponse = await groqService.generateContent(prompt, {
            temperature: 0.4
        });

        // Log the tool usage
        await AIToolLog.create({
            project_id: projectId,
            user_id: userId,
            tool_name: 'task_detailer',
            input_data: taskData,
            output_data: { detailed_text: aiResponse.text },
            tokens_used: aiResponse.tokensUsed
        });

        return {
            original_description: currentDescription,
            detailed_description: aiResponse.text
        };
    }

    /**
     * Summarize a thread of comments
     */
    async summarizeComments(projectId, userId, comments) {
        if (!comments || comments.length === 0) {
            return { summary: "No discussion found to summarize." };
        }

        const commentText = comments.map(c => `${c.user?.name || 'User'}: ${c.content}`).join('\n');

        const prompt = `Summarize the following project management discussion thread into 3 key bullet points focusing on decisions, blockers, and next steps.
        
Discussion:
${commentText}

Summary:`;

        const aiResponse = await groqService.generateContent(prompt, {
            temperature: 0.3
        });

        // Log the tool usage
        await AIToolLog.create({
            project_id: projectId,
            user_id: userId,
            tool_name: 'comment_summarizer',
            input_data: { comment_count: comments.length },
            output_data: { summary: aiResponse.text },
            tokens_used: aiResponse.tokensUsed
        });

        return {
            summary: aiResponse.text
        };
    }
}

module.exports = new AIAssistantService();
