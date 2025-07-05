const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"FIT-verse Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log(`✅ Email sent to ${to} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.message);
    throw error; // rethrow to let controller handle it
  }
};

module.exports = sendEmail;
