// Test which Gemini models are available
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        console.log('Testing available Gemini models...\n');

        const modelsToTest = [
            'gemini-pro',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-2.0-flash-exp',
            'models/gemini-pro',
            'models/gemini-1.5-pro',
            'models/gemini-1.5-flash'
        ];

        for (const modelName of modelsToTest) {
            try {
                console.log(`Testing: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Hello');
                const response = result.response;
                console.log(`✅ ${modelName} - WORKS! Response: ${response.text().substring(0, 50)}...\n`);
            } catch (error) {
                console.log(`❌ ${modelName} - FAILED: ${error.message.substring(0, 100)}\n`);
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

listModels();
