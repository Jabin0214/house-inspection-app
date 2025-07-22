import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { InspectionTaskModel } from '@/lib/models/InspectionTask';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { taskId } = await request.json();
        const task = await InspectionTaskModel.findOne({ id: taskId });
        if (!task) {
            return NextResponse.json({ success: false, error: '未找到该任务' }, { status: 404 });
        }
        const result = await sendEmail(task);
        if (result === true) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: false, error: '发送邮件失败' }, { status: 500 });
        }
    } catch (error) {
        console.error('发送邮件失败:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '发送邮件失败' }, { status: 500 });
    }
} 