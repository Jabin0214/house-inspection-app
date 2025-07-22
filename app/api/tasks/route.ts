import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { type InspectionTask } from '@/lib/models/InspectionTask';
import { type IProperty } from '@/lib/models/Property';

export async function GET() {
    console.log('开始处理 GET /api/tasks 请求');
    try {
        console.log('尝试连接数据库...');
        await dbConnect();
        console.log('数据库连接成功');

        console.log('正在导入 InspectionTaskModel...');
        const { InspectionTaskModel } = await import('@/lib/models/InspectionTask');
        console.log('InspectionTaskModel 导入成功');

        console.log('开始查询任务列表...');
        const tasks = await InspectionTaskModel.find({ status: { $ne: '完成' } })
            .sort({ scheduled_at: 1, createdAt: -1 });
        console.log(`成功获取 ${tasks.length} 个任务`);

        return NextResponse.json({
            success: true,
            data: tasks
        });
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

        console.error('获取任务列表失败，详细错误信息:', errorDetails);

        return NextResponse.json({
            success: false,
            error: `获取任务列表失败: ${errorDetails.message}`,
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    console.log('开始处理 POST /api/tasks 请求');
    try {
        console.log('尝试连接数据库...');
        await dbConnect();
        console.log('数据库连接成功');

        const data = await request.json();
        console.log('收到的请求数据:', JSON.stringify(data, null, 2));

        if (!data.address || !data.inspection_type) {
            console.log('请求数据验证失败: 缺少必要字段');
            return NextResponse.json({
                success: false,
                error: '地址和检查类型为必填项'
            }, { status: 400 });
        }

        console.log('正在导入模型...');
        const { PropertyModel } = await import('@/lib/models/Property');
        const { InspectionTaskModel } = await import('@/lib/models/InspectionTask');
        console.log('模型导入成功');

        console.log('查询物业信息...');
        const property = await PropertyModel.findOne({ Property: data.address });
        if (!property) {
            console.log('物业不存在:', data.address);
            return NextResponse.json({
                success: false,
                error: '该地址不存在于物业列表中'
            }, { status: 400 });
        }
        console.log('物业信息验证成功');

        console.log('创建新任务...');
        const task = new InspectionTaskModel(data);
        await task.save();
        console.log('任务创建成功:', task.id);

        return NextResponse.json({
            success: true,
            data: task
        });
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

        console.error('创建任务失败，详细错误信息:', errorDetails);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '创建任务失败',
            details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
        }, { status: 500 });
    }
}