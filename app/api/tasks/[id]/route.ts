import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/database';
import InspectionTask from '@/lib/models/InspectionTask';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const task = await InspectionTask.findOne({ id: params.id });
        if (!task) {
            return NextResponse.json(
                { success: false, error: '任务不存在' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: task });
    } catch (error) {
        console.error('获取任务详情失败:', error);
        return NextResponse.json(
            { success: false, error: '获取任务详情失败' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const data = await request.json();
        const task = await InspectionTask.findOneAndUpdate(
            { id: params.id },
            { $set: data },
            { new: true }
        );
        if (!task) {
            return NextResponse.json(
                { success: false, error: '任务不存在' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: task });
    } catch (error) {
        console.error('更新任务失败:', error);
        return NextResponse.json(
            { success: false, error: '更新任务失败' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const task = await InspectionTask.findOneAndDelete({ id: params.id });
        if (!task) {
            return NextResponse.json(
                { success: false, error: '任务不存在' },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除任务失败:', error);
        return NextResponse.json(
            { success: false, error: '删除任务失败' },
            { status: 500 }
        );
    }
}