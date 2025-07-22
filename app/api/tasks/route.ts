import { NextRequest, NextResponse } from 'next/server';
import { getInspectionTasks, addInspectionTask } from '../../../lib/database';

export async function GET() {
    try {
        const tasks = await getInspectionTasks();
        return NextResponse.json({
            success: true,
            data: tasks
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || '获取任务失败'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const taskData = await request.json();
        const newTask = await addInspectionTask(taskData);

        return NextResponse.json({
            success: true,
            data: newTask
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || '添加任务失败'
            },
            { status: 500 }
        );
    }
} 