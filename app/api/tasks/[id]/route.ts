import { NextRequest, NextResponse } from 'next/server';
import { updateInspectionTask, deleteInspectionTask } from '../../../../lib/database';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const updateData = await request.json();

        // 不允许更新 id 和 created_at
        delete updateData.id;
        delete updateData.created_at;

        const updatedTask = await updateInspectionTask(id, updateData);

        return NextResponse.json({
            success: true,
            data: updatedTask
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || '更新任务失败'
            },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await deleteInspectionTask(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || '删除任务失败'
            },
            { status: 500 }
        );
    }
}