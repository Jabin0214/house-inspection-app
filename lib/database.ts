import { dbConnect } from './mongodb';
import { InspectionTaskModel, IInspectionTask, InspectionTask, InspectionTaskInsert, InspectionTaskUpdate } from './models/InspectionTask';
import { PropertyModel } from './models/Property';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

// 检查连接状态的工具函数
export function isConnected() {
    return mongoose.connection.readyState === 1;
}

// 获取所有检查任务（按时间排序）
export async function getInspectionTasks(): Promise<InspectionTask[]> {
    try {
        await dbConnect();

        const tasks = await InspectionTaskModel.find({
            status: { $ne: '完成' }  // 不包括已完成的任务
        })
            .sort({ scheduled_at: 1 })
            .lean()
            .exec();

        return (tasks as unknown as IInspectionTask[]).map(task => ({
            id: task._id?.toString() || '',
            address: task.address || '',
            inspection_type: task.inspection_type,
            phone: task.phone || '',
            email: task.email || '',
            scheduled_at: task.scheduled_at?.toISOString(),
            status: task.status,
            notes: task.notes || ''
        }));
    } catch (error) {
        console.error('获取任务列表失败:', error);
        throw new Error('获取任务列表失败');
    }
}

// 获取历史记录（完成的任务）
export async function getCompletedTasks(): Promise<InspectionTask[]> {
    try {
        await dbConnect();

        const tasks = await InspectionTaskModel.find({ status: '完成' })
            .sort({ scheduled_at: -1 })
            .lean()
            .exec();

        return (tasks as unknown as IInspectionTask[]).map(task => ({
            id: task._id?.toString() || '',
            address: task.address || '',
            inspection_type: task.inspection_type,
            phone: task.phone || '',
            email: task.email || '',
            scheduled_at: task.scheduled_at?.toISOString(),
            status: task.status,
            notes: task.notes || ''
        }));
    } catch (error) {
        console.error('获取已完成任务列表失败:', error);
        throw new Error('获取已完成任务列表失败');
    }
}

// 添加新的检查任务
export async function addInspectionTask(taskData: InspectionTaskInsert): Promise<InspectionTask> {
    try {
        await dbConnect();

        // 验证地址是否存在
        const propertyExists = await PropertyModel.exists({ Property: taskData.address });
        if (!propertyExists) {
            throw new Error('该地址不存在于物业列表中');
        }

        const newTask = new InspectionTaskModel({
            id: uuidv4(),
            address: taskData.address,
            inspection_type: taskData.inspection_type,
            phone: taskData.phone || '',
            email: taskData.email || '',
            scheduled_at: taskData.scheduled_at ? new Date(taskData.scheduled_at) : undefined,
            status: taskData.status || '需约时间',
            notes: taskData.notes || ''
        });

        const savedTask = await newTask.save();
        return {
            id: savedTask.id || savedTask._id?.toString() || '',
            address: savedTask.address,
            inspection_type: savedTask.inspection_type,
            phone: savedTask.phone || '',
            email: savedTask.email || '',
            scheduled_at: savedTask.scheduled_at?.toISOString(),
            status: savedTask.status,
            notes: savedTask.notes || ''
        };
    } catch (error) {
        console.error('添加任务失败:', error);
        throw error instanceof Error ? error : new Error('添加任务失败');
    }
}

// 更新检查任务
export async function updateInspectionTask(id: string, updates: InspectionTaskUpdate): Promise<InspectionTask> {
    try {
        await dbConnect();

        // 禁止更新address
        if ('address' in updates) {
            delete updates.address;
        }

        const updateData: any = { ...updates };
        if (updateData.scheduled_at) {
            updateData.scheduled_at = new Date(updateData.scheduled_at);
        }

        delete updateData.id;

        const updatedTask = await InspectionTaskModel.findOneAndUpdate(
            { id },
            updateData,
            { new: true, runValidators: true }
        ).lean();

        if (!updatedTask) {
            throw new Error('任务不存在');
        }

        const task = updatedTask as unknown as IInspectionTask;
        return {
            id: task.id || task._id?.toString() || '',
            address: task.address || '',
            inspection_type: task.inspection_type,
            phone: task.phone || '',
            email: task.email || '',
            scheduled_at: task.scheduled_at?.toISOString(),
            status: task.status,
            notes: task.notes || ''
        };
    } catch (error) {
        console.error('更新任务失败:', error);
        throw error instanceof Error ? error : new Error('更新任务失败');
    }
}

// 状态推进逻辑
export function getNextStatus(currentStatus: InspectionTask['status']): InspectionTask['status'] | null {
    const statusFlow: InspectionTask['status'][] = ['需约时间', '已发邮件', '等待检查', '完成'];
    const currentIndex = statusFlow.indexOf(currentStatus);

    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
        return null;
    }

    return statusFlow[currentIndex + 1];
}

// 推进任务状态
export async function advanceTaskStatus(id: string, currentStatus: InspectionTask['status']): Promise<InspectionTask> {
    try {
        const nextStatus = getNextStatus(currentStatus);
        if (!nextStatus) {
            throw new Error('无法推进状态');
        }

        return updateInspectionTask(id, { status: nextStatus });
    } catch (error) {
        console.error('推进任务状态失败:', error);
        throw error instanceof Error ? error : new Error('推进任务状态失败');
    }
}

export async function getAllProperties(): Promise<string[]> {
    try {
        await dbConnect();
        const properties = await PropertyModel.find({})
            .sort({ Property: 1 })
            .lean()
            .exec();
        return properties.map(p => p.Property);
    } catch (error) {
        console.error('获取物业列表失败:', error);
        throw new Error('获取物业列表失败');
    }
}

export async function deleteInspectionTask(id: string): Promise<void> {
    try {
        await dbConnect();
        const result = await InspectionTaskModel.deleteOne({ id });
        if (result.deletedCount === 0) {
            throw new Error('任务不存在或已被删除');
        }
    } catch (error) {
        console.error('删除任务失败:', error);
        throw error instanceof Error ? error : new Error('删除任务失败');
    }
}