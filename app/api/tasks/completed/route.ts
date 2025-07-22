import { NextResponse } from 'next/server';
import { getCompletedTasks } from '../../../../lib/database';

export async function GET() {
    try {
        const tasks = await getCompletedTasks();
        return NextResponse.json({
            success: true,
            data: tasks
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || '获取已完成任务失败'
            },
            { status: 500 }
        );
    }
} 