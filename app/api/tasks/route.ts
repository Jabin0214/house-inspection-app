import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/database';
import InspectionTask from '@/lib/models/InspectionTask';

export async function GET() {
    try {
        await dbConnect();
        const tasks = await InspectionTask.find().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: tasks });
    } catch (error) {
        console.error('获取任务列表失败:', error);
        return NextResponse.json(
            { success: false, error: '获取任务列表失败' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const data = await request.json();
        const task = new InspectionTask(data);
        await task.save();
        return NextResponse.json({ success: true, data: task });
    } catch (error) {
        console.error('创建任务失败:', error);
        return NextResponse.json(
            { success: false, error: '创建任务失败' },
            { status: 500 }
        );
    }
} 