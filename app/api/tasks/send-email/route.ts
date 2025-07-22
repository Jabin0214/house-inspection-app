import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { taskId } = await request.json();

        if (!taskId) {
            return NextResponse.json({
                success: false,
                error: '任务ID是必需的'
            }, { status: 400 });
        }

        const { InspectionTaskModel } = await import('@/lib/models/InspectionTask');
        const task = await InspectionTaskModel.findOne({ id: taskId });

        if (!task) {
            return NextResponse.json({
                success: false,
                error: '未找到指定任务'
            }, { status: 404 });
        }

        if (!task.email) {
            return NextResponse.json({
                success: false,
                error: '该任务没有设置邮箱地址'
            }, { status: 400 });
        }

        const success = await sendEmail(task);

        if (success) {
            return NextResponse.json({
                success: true,
                message: '邮件发送成功'
            });
        } else {
            throw new Error('邮件发送失败');
        }
    } catch (error) {
        console.error('发送邮件时出错:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '邮件发送失败'
        }, { status: 500 });
    }
} 