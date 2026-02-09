const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }

        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = null;
    }

    /**
     * Get Gemini model with configuration
     */
    getModel(config = {}) {
        const defaultConfig = {
            model: 'gemini-1.5-pro', // Confirmed working with this API key
            generationConfig: {
                temperature: config.temperature || 0.7,
                topK: config.topK || 40,
                topP: config.topP || 0.95,
                maxOutputTokens: config.maxOutputTokens || 2048,
            },
            systemInstruction: config.systemInstruction || 'You are a helpful project management AI assistant. Be concise and actionable.'
        };

        return this.genAI.getGenerativeModel(defaultConfig);
    }

    /**
     * Generate content with retry logic
     */
    async generateContent(prompt, config = {}, maxRetries = 3) {
        const model = this.getModel(config);

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await model.generateContent(prompt);
                const response = result.response;

                // Check for blocked content
                if (!response.text()) {
                    throw new Error('Content was blocked by safety filters');
                }

                return {
                    text: response.text(),
                    tokensUsed: this.estimateTokens(prompt + response.text())
                };
            } catch (error) {
                // Log the actual error for debugging
                console.error('Gemini API Error:', error.message);
                console.error('Error details:', error);

                // Handle rate limiting
                if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429')) {
                    if (attempt < maxRetries - 1) {
                        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                        console.log(`Rate limit hit. Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    throw new Error('AI service rate limit exceeded. Please try again later.');
                }

                // Handle safety filter
                if (error.message.includes('safety')) {
                    throw new Error('Content was blocked by safety filters. Please rephrase your request.');
                }

                // Other errors
                if (attempt === maxRetries - 1) {
                    throw new Error(`AI service error: ${error.message}`);
                }

                // Retry on other errors
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    /**
     * Generate content with streaming
     */
    async* generateContentStream(prompt, config = {}) {
        const model = this.getModel(config);

        try {
            const result = await model.generateContentStream(prompt);

            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                    yield text;
                }
            }
        } catch (error) {
            if (error.message.includes('quota') || error.message.includes('rate limit')) {
                throw new Error('AI service rate limit exceeded. Please try again later.');
            }
            if (error.message.includes('safety')) {
                throw new Error('Content was blocked by safety filters.');
            }
            throw new Error(`AI streaming error: ${error.message}`);
        }
    }

    /**
     * Parse JSON from AI response
     */
    parseJSON(text) {
        try {
            // Try to find JSON in the response
            const jsonMatch = text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            throw new Error('Failed to parse JSON from AI response. Please try again.');
        }
    }

    /**
     * Estimate token count (rough approximation)
     * More accurate would require tiktoken, but this is good enough
     */
    estimateTokens(text) {
        // Rough estimate: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
    }

    /**
     * Build context from project data
     */
    buildProjectContext(project, tasks = [], members = []) {
        const context = {
            project: {
                name: project.name,
                description: project.description || 'No description',
                status: project.status,
                created_at: project.created_at
            },
            statistics: {
                total_tasks: tasks.length,
                completed: tasks.filter(t => t.status === 'Done').length,
                in_progress: tasks.filter(t => t.status === 'In Progress').length,
                todo: tasks.filter(t => t.status === 'To Do').length,
                blocked: tasks.filter(t => t.status === 'Blocked').length
            },
            recent_tasks: tasks.slice(0, 10).map(t => ({
                title: t.title,
                status: t.status,
                priority: t.priority,
                assignees: t.assignees?.map(a => a.name) || []
            })),
            team_members: members.map(m => ({
                name: m.user?.name || 'Unknown',
                role: m.role
            }))
        };

        return JSON.stringify(context, null, 2);
    }

    /**
     * Build conversation history for chat
     */
    buildConversationHistory(messages, limit = 10) {
        return messages
            .slice(-limit)
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n');
    }
}

module.exports = new GeminiService();
