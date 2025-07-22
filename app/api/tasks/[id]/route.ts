import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { InspectionTaskModel } from '@/lib/models/InspectionTask';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const task = await InspectionTaskModel.findOne({ id: params.id });
        if (!task) {
            return NextResponse.json({ success: false, error: '未找到该任务' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: task });
    } catch (error) {
        console.error('获取任务失败:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '获取任务失败' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const updateData = await request.json();
        const task = await InspectionTaskModel.findOneAndUpdate({ id: params.id }, updateData, { new: true });
        if (!task) {
            return NextResponse.json({ success: false, error: '未找到该任务' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: task });
    } catch (error) {
        console.error('更新任务失败:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '更新任务失败' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const task = await InspectionTaskModel.findOneAndDelete({ id: params.id });
        if (!task) {
            return NextResponse.json({ success: false, error: '未找到该任务' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除任务失败:', error);
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '删除任务失败' }, { status: 500 });
    }
}