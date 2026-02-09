require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
    try {
        console.log('🧪 Testing Gemini API...');
        console.log('API Key:', process.env.GEMINI_API_KEY?.substring(0, 20) + '...');

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Try different model names
        const modelsToTry = [
            'gemini-pro',
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.5-flash-latest',
            'models/gemini-pro',
            'models/gemini-1.5-flash'
        ];

        for (const modelName of modelsToTry) {
            try {
                console.log(`\n📝 Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Say "Hello"');
                const response = result.response.text();
                console.log(`✅ SUCCESS with ${modelName}!`);
                console.log(`Response: ${response}`);
                break;
            } catch (error) {
                console.log(`❌ Failed: ${error.message.substring(0, 100)}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testGemini();
