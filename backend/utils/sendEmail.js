const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  console.log('[SendEmail] Starting email send process...');
  console.log('[SendEmail] To:', to);
  console.log('[SendEmail] Subject:', subject);
  console.log('[SendEmail] Environment check:', {
    hasEmailUser: !!process.env.EMAIL_USER,
    hasEmailPass: !!process.env.EMAIL_PASS,
    emailUser: process.env.EMAIL_USER
  });
  
  try {
    console.log('[SendEmail] Attempting to send email...');
    const info = await transporter.sendMail({
      from: `"FIT-verse Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log(`✅ [SendEmail] Email sent to ${to} - Message ID: ${info.messageId}`);
    console.log('[SendEmail] Full response:', info);
  } catch (error) {
    console.error(`❌ [SendEmail] Error sending email to ${to}:`, error.message);
    console.error('[SendEmail] Full error:', error);
    throw error; // rethrow to let controller handle it
  }
};

module.exports = sendEmail;
