// Quick test of friend's API key
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
console.log('🔑 Testing Friend\'s API Key');
console.log('Key:', apiKey ? apiKey.substring(0, 20) + '...' : 'Not found');

const genAI = new GoogleGenerativeAI(apiKey);

async function quickTest() {
    try {
        console.log('\n✅ Testing gemini-2.5-pro...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const result = await model.generateContent('Say "Hello from Gemini!"');
        const response = result.response.text();

        console.log('✅ SUCCESS! API key works!');
        console.log('Response:', response);
        console.log('\n🎉 Friend\'s API key is valid and working!');
        console.log('💡 You can now test all AI endpoints in Postman!');
    } catch (error) {
        console.log('❌ FAILED');
        console.log('Error:', error.message);

        if (error.status === 429) {
            console.log('\n⚠️  Rate limit hit - wait a few minutes and try again');
        } else if (error.status === 404) {
            console.log('\n❌ Model not found - API key might not have access');
        } else {
            console.log('\n❌ API key might be invalid or restricted');
        }
    }
}

quickTest();
