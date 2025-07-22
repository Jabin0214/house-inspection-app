import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import InspectionTask from '@/lib/models/InspectionTask';

export async function GET() {
    try {
        await dbConnect();
        const tasks = await InspectionTask.find({ status: '完成' })
            .sort({ updatedAt: -1 })
            .exec();

        return NextResponse.json({ success: true, data: tasks });
    } catch (error) {
        console.error('获取历史记录失败:', error);
        return NextResponse.json(
            { success: false, error: '获取历史记录失败' },
            { status: 500 }
        );
    }
} 