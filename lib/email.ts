import nodemailer from 'nodemailer';
import type { InspectionTask } from './models/InspectionTask';

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// 获取英文检查类型名称
const getInspectionTypeText = (type: string) => {
  const typeMap = {
    'routine': 'routine inspection',
    'move-in': 'move-in inspection',
    'move-out': 'move-out inspection'
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

// 生成英文邮件内容（无时间）
const generateEmailContent = (task: InspectionTask) => {
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
};

// 发送邮件
export const sendEmail = async (task: InspectionTask): Promise<boolean> => {
  if (!task.email) {
    throw new Error('Recipient email is not set');
  }

  const { subject, text, html } = generateEmailContent(task);

  try {
    await transporter.sendMail({
      from: {
        name: 'ST International',
        address: process.env.EMAIL_USER as string
      },
      to: task.email,
      subject,
      text,
      html
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};