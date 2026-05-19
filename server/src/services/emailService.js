const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

function loadTemplate(templateName) {
  const filePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
  return fs.readFileSync(filePath, 'utf-8');
}

async function sendEmail({ to, subject, templateName, data }) {
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log(`[Email skipped - disabled] To: ${to}, Subject: ${subject}`);
    return;
  }
  
  try {
    const templateSource = loadTemplate(templateName);
    const template = handlebars.compile(templateSource);
    const html = template(data);
    
    await transporter.sendMail({ 
      from: process.env.EMAIL_FROM || "AtomQuest Portal <noreply@atomquest.com>", 
      to, 
      subject, 
      html 
    });
  } catch (error) {
    console.error(`[Email Failed] To: ${to}, Subject: ${subject}`, error);
  }
}

module.exports = { sendEmail };
