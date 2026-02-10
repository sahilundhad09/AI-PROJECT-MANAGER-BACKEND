// Test Email Service
require('dotenv').config();
const emailService = require('./src/shared/services/email.service');

async function testEmailService() {
    console.log('🧪 Testing Email Service...\n');

    try {
        // Test connection
        console.log('1. Testing connection...');
        const isConnected = await emailService.verifyConnection();
        if (!isConnected) {
            console.error('❌ Email service connection failed');
            return;
        }

        // Test welcome email
        console.log('\n2. Sending welcome email...');
        await emailService.sendWelcomeEmail(
            process.env.EMAIL_USER,
            'Test User'
        );

        console.log('\n✅ All tests passed!');
        console.log('Check your inbox:', process.env.EMAIL_USER);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testEmailService();
