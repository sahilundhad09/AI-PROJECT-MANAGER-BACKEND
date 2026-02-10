// Simplified Email Service Test - Direct Method Testing
require('dotenv').config();
const emailService = require('./src/shared/services/email.service');

const TEST_EMAIL = process.env.EMAIL_USER; // Send to yourself

async function testAllEmails() {
    console.log('🧪 Testing All Email Types');
    console.log('==========================\n');
    console.log(`📧 Sending test emails to: ${TEST_EMAIL}\n`);

    try {
        // Test 1: Welcome Email
        console.log('1️⃣  Testing Welcome Email...');
        await emailService.sendWelcomeEmail(TEST_EMAIL, 'Test User');
        console.log('✅ Welcome email sent\n');

        // Test 2: Login Notification
        console.log('2️⃣  Testing Login Notification...');
        await emailService.sendLoginNotification(
            TEST_EMAIL,
            'Test User',
            '192.168.1.1',
            'Mozilla/5.0 (Test Browser)'
        );
        console.log('✅ Login notification sent\n');

        // Test 3: Password Reset
        console.log('3️⃣  Testing Password Reset Email...');
        await emailService.sendPasswordReset(
            TEST_EMAIL,
            'Test User',
            'test-reset-token-12345'
        );
        console.log('✅ Password reset email sent\n');

        // Test 4: Workspace Invitation
        console.log('4️⃣  Testing Workspace Invitation...');
        await emailService.sendWorkspaceInvite(
            TEST_EMAIL,
            'Test Workspace',
            'Admin User',
            'test-invite-token-67890'
        );
        console.log('✅ Workspace invitation sent\n');

        // Test 5: Task Assignment
        console.log('5️⃣  Testing Task Assignment Email...');
        await emailService.sendTaskAssignment(
            TEST_EMAIL,
            'Implement Email Notifications',
            'AI Project Manager',
            'Project Lead',
            'task-id-123'
        );
        console.log('✅ Task assignment email sent\n');

        // Test 6: Comment Notification
        console.log('6️⃣  Testing Comment Notification...');
        await emailService.sendCommentNotification(
            TEST_EMAIL,
            'Team Member',
            'Implement Email Notifications',
            'Great work on the email service! The templates look amazing.',
            'task-id-123'
        );
        console.log('✅ Comment notification sent\n');

        // Test 7: Project Member Added
        console.log('7️⃣  Testing Project Member Added Email...');
        await emailService.sendProjectMemberAdded(
            TEST_EMAIL,
            'AI Project Manager',
            'Admin User'
        );
        console.log('✅ Project member added email sent\n');

        // Test 8: Task Due Date Reminder
        console.log('8️⃣  Testing Due Date Reminder...');
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 2); // Due in 2 days
        await emailService.sendTaskDueReminder(
            TEST_EMAIL,
            'Implement Email Notifications',
            dueDate,
            'task-id-123'
        );
        console.log('✅ Due date reminder sent\n');

        console.log('========================================');
        console.log('✅ All 8 Email Types Sent Successfully!');
        console.log('========================================\n');
        console.log(`📬 Check your Gmail inbox: ${TEST_EMAIL}`);
        console.log('\nExpected emails:');
        console.log('  1. Welcome to Cronos AI');
        console.log('  2. New Login Detected');
        console.log('  3. Reset Your Password');
        console.log('  4. Workspace Invitation');
        console.log('  5. New Task Assigned');
        console.log('  6. New Comment');
        console.log('  7. Project Access Granted');
        console.log('  8. Task Due Soon');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testAllEmails();
