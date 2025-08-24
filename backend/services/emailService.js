const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || 'your-email@gmail.com',
                pass: process.env.SMTP_PASS || 'your-app-password'
            }
        });
    }

    async send2FACode(email, name, code) {
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'noreply@gym-wale.com',
            to: email,
            subject: 'Gym-Wale Admin - Security Verification Code',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .code-container { background: white; border: 2px solid #1976d2; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
                        .verification-code { font-size: 32px; font-weight: bold; color: #1976d2; letter-spacing: 5px; margin: 10px 0; }
                        .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Security Verification Required</h1>
                            <p>Gym-Wale Admin Portal</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${name},</h2>
                            <p>Someone is attempting to sign in to your Gym-Wale admin account. To complete the login process, please use the verification code below:</p>
                            
                            <div class="code-container">
                                <p><strong>Your Verification Code:</strong></p>
                                <div class="verification-code">${code}</div>
                                <p><small>This code expires in 5 minutes</small></p>
                            </div>

                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong>
                                <ul>
                                    <li>This code was requested from IP: ${process.env.NODE_ENV === 'production' ? 'Hidden for security' : 'Development'}</li>
                                    <li>If you didn't request this code, please ignore this email and consider changing your password</li>
                                    <li>Never share this code with anyone</li>
                                </ul>
                            </div>

                            <p>For your security, this verification code will expire in 5 minutes. If you need a new code, you can request one from the login page.</p>
                            
                            <p>Best regards,<br>Gym-Wale Security Team</p>
                        </div>
                        <div class="footer">
                            <p>© 2024 Gym-Wale. All rights reserved.</p>
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('2FA code sent to:', email);
        } catch (error) {
            console.error('Error sending 2FA email:', error);
            throw new Error('Failed to send verification code');
        }
    }

    async sendPasswordReset(email, name, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/reset-password?token=${resetToken}`;
        
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'noreply@gym-wale.com',
            to: email,
            subject: 'Gym-Wale Admin - Password Reset Request',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #f44336, #ff7043); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .reset-button { display: inline-block; background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .warning { background: #ffebee; border: 1px solid #ef5350; border-radius: 5px; padding: 15px; margin: 20px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Password Reset Request</h1>
                            <p>Gym-Wale Admin Portal</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${name},</h2>
                            <p>We received a request to reset your admin account password. If you made this request, click the button below to reset your password:</p>
                            
                            <div style="text-align: center;">
                                <a href="${resetUrl}" class="reset-button">Reset My Password</a>
                            </div>

                            <p>Or copy and paste this link into your browser:</p>
                            <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">
                                ${resetUrl}
                            </p>

                            <div class="warning">
                                <strong>⚠️ Security Information:</strong>
                                <ul>
                                    <li>This reset link expires in 1 hour</li>
                                    <li>If you didn't request this reset, please ignore this email</li>
                                    <li>Your password will remain unchanged unless you click the link above</li>
                                    <li>For security reasons, please use a strong, unique password</li>
                                </ul>
                            </div>

                            <p>If you continue to have problems, please contact our support team.</p>
                            
                            <p>Best regards,<br>Gym-Wale Security Team</p>
                        </div>
                        <div class="footer">
                            <p>© 2024 Gym-Wale. All rights reserved.</p>
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Password reset email sent to:', email);
        } catch (error) {
            console.error('Error sending password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }

    async sendLoginAlert(email, name, loginDetails) {
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'noreply@gym-wale.com',
            to: email,
            subject: 'Gym-Wale Admin - New Login Detected',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #4caf50, #81c784); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .login-details { background: white; border-radius: 5px; padding: 20px; margin: 20px 0; }
                        .detail-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 New Admin Login</h1>
                            <p>Gym-Wale Admin Portal</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${name},</h2>
                            <p>We detected a new login to your Gym-Wale admin account. Here are the details:</p>
                            
                            <div class="login-details">
                                <div class="detail-row">
                                    <span><strong>Time:</strong></span>
                                    <span>${loginDetails.timestamp}</span>
                                </div>
                                <div class="detail-row">
                                    <span><strong>IP Address:</strong></span>
                                    <span>${loginDetails.ip}</span>
                                </div>
                                <div class="detail-row">
                                    <span><strong>Device:</strong></span>
                                    <span>${loginDetails.device}</span>
                                </div>
                                <div class="detail-row">
                                    <span><strong>Location:</strong></span>
                                    <span>${loginDetails.location || 'Unknown'}</span>
                                </div>
                            </div>

                            <p>If this was you, no action is needed. If you don't recognize this login, please:</p>
                            <ul>
                                <li>Change your password immediately</li>
                                <li>Check your account for any unauthorized changes</li>
                                <li>Contact our support team if you need assistance</li>
                            </ul>
                            
                            <p>Best regards,<br>Gym-Wale Security Team</p>
                        </div>
                        <div class="footer">
                            <p>© 2024 Gym-Wale. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Login alert sent to:', email);
        } catch (error) {
            console.error('Error sending login alert:', error);
            // Don't throw error for login alerts as they're not critical
        }
    }
}

module.exports = EmailService;
