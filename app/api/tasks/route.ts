import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { type InspectionTask } from '@/lib/models/InspectionTask';
import { type IProperty } from '@/lib/models/Property';

export async function GET() {
    try {
        await dbConnect();
        const { InspectionTaskModel } = await import('@/lib/models/InspectionTask');
        const tasks = await InspectionTaskModel.find({ status: { $ne: '完成' } })
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

        if (!data.address || !data.inspection_type) {
            return NextResponse.json({
                success: false,
                error: '地址和检查类型为必填项'
            }, { status: 400 });
        }

        // 从 Property 模型动态导入（避免构建时依赖错误）
        const { PropertyModel } = await import('@/lib/models/Property');
        const { InspectionTaskModel } = await import('@/lib/models/InspectionTask');

        const property = await PropertyModel.findOne({ Property: data.address });
        if (!property) {
            return NextResponse.json({
                success: false,
                error: '该地址不存在于物业列表中'
            }, { status: 400 });
        }

        const task = new InspectionTaskModel(data);
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