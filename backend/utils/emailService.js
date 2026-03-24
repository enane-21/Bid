const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    // For development, use ethereal email (fake SMTP)
    // For production, use real SMTP credentials from .env
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    // Fallback to console logging if no email config
    return null;
};

const sendVerificationEmail = async (user, verificationToken) => {
    const transporter = createTransporter();

    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@ebid.com',
        to: user.email,
        subject: 'Verify Your Email - E-Bid System',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 15px 30px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                    .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏢 E-Bid System</h1>
                        <p>Supplier Registration Verification</p>
                    </div>
                    <div class="content">
                        <h2>Welcome, ${user.name}!</h2>
                        <p>Thank you for registering as a supplier with E-Bid System.</p>
                        
                        <p>To complete your registration, please verify your email address by clicking the button below:</p>
                        
                        <div style="text-align: center;">
                            <a href="${verificationUrl}" class="button">Verify Email Address</a>
                        </div>
                        
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #059669;">${verificationUrl}</p>
                        
                        <div class="info-box">
                            <strong>⚠️ Important:</strong> This verification link will expire in 5 minutes.
                        </div>
                        
                        <div class="info-box">
                            <strong>📋 Next Steps:</strong>
                            <ol>
                                <li>Verify your email by clicking the link above</li>
                                <li>Wait for administrator approval</li>
                                <li>Once approved, you can log in and participate in tenders</li>
                            </ol>
                        </div>
                        
                        <p><strong>Company Details:</strong></p>
                        <ul>
                            <li>Company Name: ${user.companyName}</li>
                            <li>TIN: ${user.tinNumber}</li>
                            <li>Email: ${user.email}</li>
                            <li>Phone: ${user.phone}</li>
                        </ul>
                        
                        <p>If you didn't create this account, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 E-Bid System. All rights reserved.</p>
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    if (transporter) {
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('\n✅ Verification email sent successfully!');
            console.log('Message ID:', info.messageId);
            console.log('To:', user.email);
            console.log('Verification URL:', verificationUrl);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('\n❌ Error sending verification email:', error.message);
            console.log('Verification URL (use this manually):', verificationUrl);
            return { success: false, error: error.message };
        }
    } else {
        // Log to console if no email service configured
        console.log('\n=== EMAIL VERIFICATION (Development Mode) ===');
        console.log('To:', user.email);
        console.log('Subject: Verify Your Email - E-Bid System');
        console.log('Verification URL:', verificationUrl);
        console.log('\n📋 Copy this URL and paste in browser to verify:');
        console.log(verificationUrl);
        console.log('===========================================\n');
        return { success: true, dev: true };
    }
};

const sendApprovalNotification = async (user) => {
    const transporter = createTransporter();

    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/login`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@ebid.com',
        to: user.email,
        subject: 'Account Approved - E-Bid System',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 15px 30px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                    .success-box { background: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Account Approved!</h1>
                    </div>
                    <div class="content">
                        <h2>Congratulations, ${user.name}!</h2>
                        
                        <div class="success-box">
                            <strong>🎉 Your supplier account has been approved by the administrator!</strong>
                        </div>
                        
                        <p>You can now log in to the E-Bid System and start participating in tenders.</p>
                        
                        <div style="text-align: center;">
                            <a href="${loginUrl}" class="button">Log In Now</a>
                        </div>
                        
                        <p><strong>What you can do now:</strong></p>
                        <ul>
                            <li>Browse active tenders</li>
                            <li>Submit bids on available opportunities</li>
                            <li>Track your bid status</li>
                            <li>Communicate with the purchasing team</li>
                        </ul>
                        
                        <p>If you have any questions, please contact the administrator.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 E-Bid System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    if (transporter) {
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('\n✅ Approval notification sent successfully!');
            console.log('Message ID:', info.messageId);
            console.log('To:', user.email);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('\n❌ Error sending approval notification:', error.message);
            return { success: false, error: error.message };
        }
    } else {
        console.log('\n=== APPROVAL NOTIFICATION (Development Mode) ===');
        console.log('To:', user.email);
        console.log('Subject: Account Approved - E-Bid System');
        console.log('Login URL:', loginUrl);
        console.log('===========================================\n');
        return { success: true, dev: true };
    }
};

module.exports = {
    sendVerificationEmail,
    sendApprovalNotification
};
