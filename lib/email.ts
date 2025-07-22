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

// 获取检查类型的中文名称
const getInspectionTypeText = (type: string) => {
    const typeMap = {
        'routine': '常规检查',
        'move-in': '入住检查',
        'move-out': '退房检查'
    };
    return typeMap[type as keyof typeof typeMap] || type;
};

// 生成邮件内容
const generateEmailContent = (task: InspectionTask) => {
    const scheduledTime = task.scheduled_at
        ? new Date(task.scheduled_at).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
        : '待定';

    return {
        subject: `房屋检查通知 - ${task.address}`,
        text: `
尊敬的业主：

您好！

我们计划对以下房屋进行检查：

地址：${task.address}
检查类型：${getInspectionTypeText(task.inspection_type)}
计划时间：${scheduledTime}

${task.notes ? `\n备注：${task.notes}\n` : ''}

如果您对检查时间有任何问题，请及时与我们联系。

谢谢！

ST International Ltd
    `,
        html: `
<div style="font-family: Arial, sans-serif; color: #333;">
  <p>尊敬的业主：</p>
  <p>您好！</p>
  <p>我们计划对以下房屋进行检查：</p>
  <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
    <p><strong>地址：</strong>${task.address}</p>
    <p><strong>检查类型：</strong>${getInspectionTypeText(task.inspection_type)}</p>
    <p><strong>计划时间：</strong>${scheduledTime}</p>
    ${task.notes ? `<p><strong>备注：</strong>${task.notes}</p>` : ''}
  </div>
  <p>如果您对检查时间有任何问题，请及时与我们联系。</p>
  <p>谢谢！</p>
  <p style="color: #666; margin-top: 30px;">ST International Ltd</p>
</div>
    `
    };
};

// 发送邮件
export const sendEmail = async (task: InspectionTask): Promise<boolean> => {
    if (!task.email) {
        throw new Error('收件人邮箱地址未设置');
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
        console.error('发送邮件失败:', error);
        throw error;
    }
}; 