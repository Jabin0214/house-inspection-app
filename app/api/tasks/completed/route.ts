import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';

export async function GET() {
    try {
        console.log('开始处理 GET /api/tasks/completed 请求');
        await dbConnect();
        console.log('数据库连接成功');

        const { InspectionTaskModel } = await import('@/lib/models/InspectionTask');
        const tasks = await InspectionTaskModel.find({ status: '完成' })
            .sort({ updatedAt: -1 })
            .lean()
            .exec();

        console.log(`成功获取 ${tasks.length} 个已完成任务`);
        return NextResponse.json({ success: true, data: tasks });
    } catch (error) {
        const errorDetails = {
            message: error instanceof Error ? error.message : '未知错误',
            stack: error instanceof Error ? error.stack : '无堆栈信息',
            type: error instanceof Error ? error.constructor.name : typeof error,
            mongooseError: error instanceof Error && 'code' in error ? (error as any).code : undefined,
            env: {
                nodeEnv: process.env.NODE_ENV,
                hasMongoUri: !!process.env.MONGODB_URI,
                vercelEnv: process.env.VERCEL_ENV
            }
        };

        console.error('获取历史记录失败，详细错误信息:', errorDetails);
        return NextResponse.json({
            success: false,
            error: `获取历史记录失败: ${errorDetails.message}`,
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        }, { status: 500 });
    }
} 