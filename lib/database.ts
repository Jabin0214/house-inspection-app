import dbConnect from './mongodb';
import InspectionTask, {
    IInspectionTask,
    InspectionTask as InspectionTaskType,
    InspectionTaskInsert,
    InspectionTaskUpdate
} from './models/InspectionTask';
import Property from './models/Property';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

export { dbConnect };

// 检查连接状态的工具函数
export function isConnected() {
    return mongoose.connection.readyState === 1;
}

// 获取所有检查任务（按时间排序）
export async function getInspectionTasks(): Promise<InspectionTaskType[]> {
    await connectToDatabase();

    const tasks = await InspectionTask.find({})
        .sort({ scheduled_at: 1 })
        .exec();

    return tasks.map(task => ({
        id: (task as any).id || (task as any)._id?.toString(),
        address: (task as any).address,
        inspection_type: (task as any).inspection_type,
        phone: (task as any).phone,
        email: (task as any).email,
        scheduled_at: (task as any).scheduled_at?.toISOString(),
        status: (task as any).status
    }));
}

// 获取历史记录（完成的任务）
export async function getCompletedTasks(): Promise<InspectionTaskType[]> {
    await connectToDatabase();

    const tasks = await InspectionTask.find({ status: '完成' })
        .sort({ scheduled_at: -1 })
        .exec();

    return tasks.map(task => ({
        id: (task as any).id || (task as any)._id?.toString(),
        address: (task as any).address,
        inspection_type: (task as any).inspection_type,
        phone: (task as any).phone,
        email: (task as any).email,
        scheduled_at: (task as any).scheduled_at?.toISOString(),
        status: (task as any).status
    }));
}

// 添加新的检查任务
export async function addInspectionTask(taskData: InspectionTaskInsert): Promise<InspectionTaskType> {
    await connectToDatabase();

    const newTask = new InspectionTask({
        id: uuidv4(),
        address: taskData.address,
        inspection_type: taskData.inspection_type,
        phone: taskData.phone || '',
        email: taskData.email || '',
        scheduled_at: taskData.scheduled_at ? new Date(taskData.scheduled_at) : undefined,
        status: taskData.status || '需约时间'
    });

    const savedTask = await newTask.save();

    return {
        id: savedTask.id,
        address: savedTask.address,
        inspection_type: savedTask.inspection_type,
        phone: savedTask.phone,
        email: savedTask.email,
        scheduled_at: savedTask.scheduled_at?.toISOString(),
        status: savedTask.status
    };
}

// 更新检查任务
export async function updateInspectionTask(id: string, updates: InspectionTaskUpdate): Promise<InspectionTaskType> {
    await connectToDatabase();

    // 禁止更新address
    if ('address' in updates) {
        delete updates.address;
    }

    const updateData: any = { ...updates };
    if (updateData.scheduled_at) {
        updateData.scheduled_at = new Date(updateData.scheduled_at);
    }

    delete updateData.id;

    // 用id字段查找
    const updatedTask = await InspectionTask.findOneAndUpdate(
        { id },
        updateData,
        { new: true, runValidators: true }
    ).exec();

    if (!updatedTask) {
        throw new Error('任务不存在');
    }

    return {
        id: updatedTask.id,
        address: updatedTask.address,
        inspection_type: updatedTask.inspection_type,
        phone: updatedTask.phone,
        email: updatedTask.email,
        scheduled_at: updatedTask.scheduled_at?.toISOString(),
        status: updatedTask.status
    };
}

// 状态推进逻辑
export function getNextStatus(currentStatus: InspectionTaskType['status']): InspectionTaskType['status'] | null {
    const statusFlow: InspectionTaskType['status'][] = ['需约时间', '等待检查', '检查完毕', '上传完毕', '完成'];
    const currentIndex = statusFlow.indexOf(currentStatus);

    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
        return null;
    }

    return statusFlow[currentIndex + 1];
}

// 推进任务状态
export async function advanceTaskStatus(id: string, currentStatus: InspectionTaskType['status']): Promise<InspectionTaskType> {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) {
        throw new Error('无法推进状态');
    }

    return updateInspectionTask(id, { status: nextStatus });
}

export async function getAllProperties(): Promise<string[]> {
    await connectToDatabase();
    const properties = await Property.find({}).sort({ address: 1 }).lean();
    return properties.map((p: any) => p.address);
}

export async function deleteInspectionTask(id: string): Promise<void> {
    await connectToDatabase();
    const result = await InspectionTask.deleteOne({ id });
    if (result.deletedCount === 0) {
        throw new Error('任务不存在或已被删除');
    }
}