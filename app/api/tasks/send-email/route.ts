import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import InspectionTask from '@/lib/models/InspectionTask';

export async function POST(request: Request) {
    try {
        const { taskId } = await request.json();

        // 获取任务信息
        const task = await InspectionTask.findOne({ id: taskId });
        if (!task) {
            return NextResponse.json({ success: false, error: '任务不存在' }, { status: 404 });
        }

        if (!task.email) {
            return NextResponse.json({ success: false, error: '收件人邮箱未设置' }, { status: 400 });
        }

        // 发送邮件
        await sendEmail(task);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('发送邮件失败:', error);
        return NextResponse.json(
            { success: false, error: '发送邮件失败' },
            { status: 500 }
        );
    }
} 