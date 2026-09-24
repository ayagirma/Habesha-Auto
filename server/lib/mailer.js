const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    // Development fallback logger transport
    transporter = {
      sendMail: async (options) => {
        console.log('\n======================================================');
        console.log('📧 [EMAIL DISPATCH - DEV SIMULATOR]');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`------------------------------------------------------`);
        console.log(options.text || options.html);
        console.log('======================================================\n');
        return { messageId: 'dev-simulated-' + Date.now() };
      }
    };
  }

  return transporter;
}

/**
 * Send a 6-digit One-Time Password (OTP) for password reset
 * @param {string} email 
 * @param {string} otp 
 * @param {string} name 
 */
async function sendOtpEmail(email, otp, name = 'Valued Customer') {
  const mailer = getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Habesha Auto Support" <no-reply@habeshaauto.com>',
    to: email,
    subject: `🔐 ${otp} is your Habesha Auto Password Reset Code`,
    text: `Hello ${name},\n\nYour 6-digit verification code to reset your Habesha Auto account password is:\n\n${otp}\n\nThis code will expire in 10 minutes. If you did not request this password reset, please ignore this email or contact support.\n\nBest regards,\nHabesha Auto Team`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
          .container { max-width: 520px; margin: 0 auto; background: #111827; border: 1px solid #1f293d; border-radius: 14px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #1f293d 0%, #111827 100%); padding: 24px; text-align: center; border-bottom: 1px solid #2d3748; }
          .logo-text { font-size: 20px; font-weight: 800; color: #f59e0b; letter-spacing: 0.05em; text-transform: uppercase; }
          .content { padding: 32px 24px; text-align: center; }
          .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
          .desc { font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }
          .otp-box { background: #0f172a; border: 2px dashed #f59e0b; border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 24px; }
          .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #f59e0b; font-family: monospace; }
          .meta { font-size: 12px; color: #6b7280; line-height: 1.5; margin-top: 12px; }
          .footer { background: #0a0e17; padding: 16px; text-align: center; font-size: 11px; color: #4b5563; border-top: 1px solid #1f293d; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-text">⚡ HABESHA AUTO</div>
          </div>
          <div class="content">
            <h1 class="title">Password Reset Verification</h1>
            <p class="desc">Hello <strong>${name}</strong>,<br>We received a request to reset your password. Use the single-use OTP code below to verify your identity and set a new password:</p>
            <div class="otp-box">
              <span class="otp-code">${otp}</span>
            </div>
            <p class="meta">⏰ This verification code is valid for <strong>10 minutes</strong>.<br>If you did not request this, please disregard this email.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Habesha Auto Care. Precision Service &amp; Diagnostics.
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await mailer.sendMail(mailOptions);
}

module.exports = {
  sendOtpEmail,
  getTransporter
};
