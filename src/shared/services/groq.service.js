const Groq = require('groq-sdk');

class GroqService {
    constructor() {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is not set in environment variables');
        }

        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
    }

    /**
     * Generate content with retry logic
     */
    async generateContent(prompt, config = {}, maxRetries = 3) {
        const model = config.model || 'llama-3.3-70b-versatile';
        const systemInstruction = config.systemInstruction || 'You are a helpful project management AI assistant. Be concise and actionable.';

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const completion = await this.groq.chat.completions.create({
                    messages: [
                        {
                            role: 'system',
                            content: systemInstruction
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    model: model,
                    temperature: config.temperature || 0.7,
                    max_tokens: config.maxOutputTokens || 2048,
                    top_p: config.topP || 0.95,
                });

                const text = completion.choices[0]?.message?.content || '';

                if (!text) {
                    throw new Error('Empty response from AI');
                }

                return {
                    text: text,
                    tokensUsed: completion.usage?.total_tokens || this.estimateTokens(prompt + text)
                };
            } catch (error) {
                // Log the actual error for debugging
                console.error('Groq API Error:', error.message);

                // Handle rate limiting
                if (error.message.includes('rate limit') || error.status === 429) {
                    if (attempt < maxRetries - 1) {
                        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                        console.log(`Rate limit hit. Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    throw new Error('AI service rate limit exceeded. Please try again later.');
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
        const model = config.model || 'llama-3.3-70b-versatile';
        const systemInstruction = config.systemInstruction || 'You are a helpful project management AI assistant. Be concise and actionable.';

        try {
            const stream = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: systemInstruction
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: model,
                temperature: config.temperature || 0.7,
                max_tokens: config.maxOutputTokens || 2048,
                top_p: config.topP || 0.95,
                stream: true,
            });

            for await (const chunk of stream) {
                const text = chunk.choices[0]?.delta?.content || '';
                if (text) {
                    yield text;
                }
            }
        } catch (error) {
            if (error.message.includes('rate limit') || error.status === 429) {
                throw new Error('AI service rate limit exceeded. Please try again later.');
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

module.exports = new GroqService();
