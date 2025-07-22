import { InspectionTask } from './models/InspectionTask';
import nodemailer from 'nodemailer';
import { getInspectionTypeText } from './emailUtils';

// 生成完整的邮件内容（用于服务器发送）
function generateEmailContent(task: InspectionTask) {
  const inspectionText = getInspectionTypeText(task.inspection_type);

  return {
    subject: `Arranging a ${inspectionText} - ${task.address}`,
    text: `
Dear Tenants,

We hope this email finds you well.

My name is Jabin, and I will be conducting the ${inspectionText} of your property on behalf of ST International Ltd.

We are planning to inspect the following property:

Address: ${task.address}
${task.notes ? `Notes: ${task.notes}` : ''}

To arrange a suitable time for the inspection, which should take no longer than 15 minutes, could you please let us know what days and times work best for you in the coming days?

Kind regards,
ST International Ltd
        `.trim(),
    html: `
<div style="font-family: Arial, sans-serif; color: #333;">
    <p>Dear Tenants,</p>
    <p>We hope this email finds you well.</p>
    <p>My name is Jabin, and I will be conducting the <strong>${inspectionText}</strong> of your property on behalf of ST International Ltd.</p>
    <p>We are planning to inspect the following property:</p>
    <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
        <p><strong>Address:</strong> ${task.address}</p>
        ${task.notes ? `<p><strong>Notes:</strong> ${task.notes}</p>` : ''}
    </div>
    <p>To arrange a suitable time for the inspection, which should take no longer than 15 minutes, could you please let us know what days and times work best for you in the coming days?</p>
    <p style="margin-top: 30px;">Kind regards,<br/>ST International Ltd</p>
</div>
        `.trim()
  };
}

// 发送邮件的函数
export async function sendEmail(task: InspectionTask): Promise<boolean> {
  if (!task.email) {
    throw new Error('Email address is required');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const { subject, text, html } = generateEmailContent(task);

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: task.email,
      subject,
      text,
      html
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}