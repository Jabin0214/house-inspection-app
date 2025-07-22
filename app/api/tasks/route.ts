import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import InspectionTask from '@/lib/models/InspectionTask';
import Property from '@/lib/models/Property';

export async function GET() {
    try {
        await dbConnect();
        const tasks = await InspectionTask.find({ status: { $ne: '完成' } })
            .sort({ scheduled_at: 1, createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error('获取任务列表失败:', error);
        return NextResponse.json({
            success: false,
            error: '获取任务列表失败'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const data = await request.json();

        // 验证必填字段
        if (!data.address || !data.inspection_type) {
            return NextResponse.json({
                success: false,
                error: '地址和检查类型为必填项'
            }, { status: 400 });
        }

        // 验证地址是否存在于Property集合中
        const property = await Property.findOne({ Property: data.address });
        if (!property) {
            return NextResponse.json({
                success: false,
                error: '该地址不存在于物业列表中'
            }, { status: 400 });
        }

        // 创建新任务
        const task = new InspectionTask(data);
        await task.save();

        return NextResponse.json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('创建任务失败:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '创建任务失败'
        }, { status: 500 });
    }
} 