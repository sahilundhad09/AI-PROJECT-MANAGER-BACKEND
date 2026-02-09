// Simple test to verify API key works
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key loaded:', apiKey ? `Yes (${apiKey.substring(0, 15)}...)` : 'No');

const genAI = new GoogleGenerativeAI(apiKey);

async function testSimple() {
    try {
        // Try the most basic model name without v1beta
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash-latest'
        });

        console.log('\nTesting gemini-1.5-flash-latest...');
        const result = await model.generateContent('Say hello');
        console.log('✅ SUCCESS!');
        console.log('Response:', result.response.text());
    } catch (error) {
        console.log('❌ FAILED');
        console.log('Full error:', error.message);
        console.log('\nError details:', JSON.stringify(error, null, 2));
    }
}

testSimple();
