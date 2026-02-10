const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // Use TLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        this.from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
        this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    }

    /**
     * Send email with retry logic
     */
    async sendEmail(to, subject, html, text = null) {
        try {
            const mailOptions = {
                from: this.from,
                to,
                subject,
                html,
                text: text || this.stripHtml(html)
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent to ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Email failed to ${to}:`, error.message);
            throw error;
        }
    }

    /**
     * Welcome email on registration
     */
    async sendWelcomeEmail(to, userName) {
        const subject = 'Welcome to Cronos AI Project Manager! 🎉';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Cronos AI! 🚀</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${userName}!</h2>
                        <p>Thank you for joining Cronos AI Project Manager. We're excited to have you on board!</p>
                        <p>With Cronos AI, you can:</p>
                        <ul>
                            <li>✨ Manage projects with AI-powered assistance</li>
                            <li>📊 Track tasks and collaborate with your team</li>
                            <li>🤖 Generate tasks automatically using AI</li>
                            <li>💬 Get smart suggestions for your projects</li>
                        </ul>
                        <a href="${this.frontendUrl}/dashboard" class="button">Get Started</a>
                        <p>If you have any questions, feel free to reach out to our support team.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 Cronos AI. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(to, subject, html);
    }

    /**
     * Login notification email
     */
    async sendLoginNotification(to, userName, ipAddress, userAgent) {
        const subject = 'New Login to Your Account';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
                    .warning { color: #e74c3c; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🔐 New Login Detected</h2>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>We detected a new login to your Cronos AI account.</p>
                        <div class="info-box">
                            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                            <p><strong>IP Address:</strong> ${ipAddress || 'Unknown'}</p>
                            <p><strong>Device:</strong> ${userAgent || 'Unknown'}</p>
                        </div>
                        <p>If this was you, you can safely ignore this email.</p>
                        <p class="warning">If you didn't log in, please secure your account immediately by changing your password.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(to, subject, html);
    }

    /**
     * Password reset email
     */
    async sendPasswordReset(to, userName, resetToken) {
        const resetLink = `${this.frontendUrl}/reset-password/${resetToken}`;
        const subject = 'Reset Your Password';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #e74c3c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🔑 Password Reset Request</h2>
                    </div>
                    <div class="content">
                        <p>Hi ${userName},</p>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <a href="${resetLink}" class="button">Reset Password</a>
                        <div class="warning">
                            <p><strong>⚠️ Security Notice:</strong></p>
                            <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
                        </div>
                        <p>Or copy and paste this link: <br>${resetLink}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(to, subject, html);
    }

    /**
     * Workspace invitation email
     */
    async sendWorkspaceInvite(to, workspaceName, inviterName, inviteToken) {
        const inviteLink = `${this.frontendUrl}/invite/${inviteToken}`;
        const subject = `You've been invited to join ${workspaceName}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Workspace Invitation</h1>
                    </div>
                    <div class="content">
                        <p><strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on Cronos AI!</p>
                        <p>Join your team to collaborate on projects, manage tasks, and leverage AI-powered features.</p>
                        <a href="${inviteLink}" class="button">Accept Invitation</a>
                        <p>This invitation will expire in 7 days.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(to, subject, html);
    }

    /**
     * Task assignment email
     */
    async sendTaskAssignment(to, taskTitle, projectName, assignedBy, taskId) {
        const taskLink = `${this.frontendUrl}/tasks/${taskId}`;
        const subject = `New Task Assigned: ${taskTitle}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .task-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>📋 New Task Assignment</h2>
                    </div>
                    <div class="content">
                        <p><strong>${assignedBy}</strong> assigned you a new task:</p>
                        <div class="task-box">
                            <h3>${taskTitle}</h3>
                            <p><strong>Project:</strong> ${projectName}</p>
                        </div>
                        <a href="${taskLink}" class="button">View Task</a>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(to, subject, html);
    }

    /**
     * Comment/mention notification
     */
    async sendCommentNotification(to, commenterName, taskTitle, commentText, taskId) {
        const taskLink = `${this.frontendUrl}/tasks/${taskId}`;
        const subject = `${commenterName} commented on "${taskTitle}"`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .comment-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>💬 New Comment</h2>
                    </div>
                    <div class="content">
                        <p><strong>${commenterName}</strong> commented on <strong>${taskTitle}</strong>:</p>
                        <div class="comment-box">
                            <p>${commentText}</p>
                        </div>
                        <a href="${taskLink}" class="button">View Comment</a>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(to, subject, html);
    }

    /**
     * Project member added notification
     */
    async sendProjectMemberAdded(to, projectName, addedBy) {
        const subject = `You've been added to ${projectName}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🎯 Project Access Granted</h2>
                    </div>
                    <div class="content">
                        <p><strong>${addedBy}</strong> added you to the project <strong>${projectName}</strong>!</p>
                        <p>You can now view and collaborate on this project.</p>
                        <a href="${this.frontendUrl}/projects" class="button">View Projects</a>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(to, subject, html);
    }

    /**
     * Task due date reminder
     */
    async sendTaskDueReminder(to, taskTitle, dueDate, taskId) {
        const taskLink = `${this.frontendUrl}/tasks/${taskId}`;
        const subject = `⏰ Task Due Soon: ${taskTitle}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #e74c3c; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .urgent-box { background: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; }
                    .button { display: inline-block; padding: 12px 30px; background: #e74c3c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>⏰ Task Due Soon!</h2>
                    </div>
                    <div class="content">
                        <div class="urgent-box">
                            <h3>${taskTitle}</h3>
                            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
                        </div>
                        <p>This task is approaching its deadline. Make sure to complete it on time!</p>
                        <a href="${taskLink}" class="button">View Task</a>
                    </div>
                </div>
            </body>
            </html>
        `;
        return this.sendEmail(to, subject, html);
    }

    /**
     * Strip HTML tags for plain text version
     */
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    /**
     * Verify email configuration
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service is ready');
            return true;
        } catch (error) {
            console.error('❌ Email service error:', error.message);
            return false;
        }
    }
}

module.exports = new EmailService();
