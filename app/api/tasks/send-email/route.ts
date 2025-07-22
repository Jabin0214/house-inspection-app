import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import InspectionTask from '@/lib/models/InspectionTask';
import dbConnect from '@/lib/mongodb';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { taskId } = await request.json();

        // 获取任务信息
        const task = await InspectionTask.findOne({ id: taskId }).maxTimeMS(5000).exec();
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
        const errorMessage = error instanceof Error ? error.message : '发送邮件失败';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
} 