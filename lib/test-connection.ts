import { connectToDatabase, isConnected } from './mongodb';
import InspectionTask from './models/InspectionTask';
import { v4 as uuidv4 } from 'uuid';

export async function testConnection() {
    try {
        await connectToDatabase();

        if (!isConnected()) {
            return {
                connected: false,
                collectionExists: false,
                error: { message: 'MongoDB连接失败' }
            };
        }

        try {
            const count = await InspectionTask.countDocuments();
            return {
                connected: true,
                collectionExists: true,
                documentCount: count,
                error: null
            };
        } catch (error) {
            return {
                connected: true,
                collectionExists: false,
                error: error
            };
        }
    } catch (error) {
        return {
            connected: false,
            collectionExists: false,
            error
        };
    }
}

export async function createSampleData() {
    try {
        await connectToDatabase();

        const count = await InspectionTask.countDocuments();
        if (count > 0) {
            return { success: true, message: '数据库中已有数据' };
        }

        const sampleTasks = [
            {
                id: uuidv4(),
                address: '北京市朝阳区三里屯SOHO 3号楼1801',
                inspection_type: 'move-in',
                phone: '13812345678',
                email: 'example1@email.com',
                scheduled_at: new Date('2024-01-20T10:00:00.000Z'),
                status: '等待检查'
            },
            {
                id: uuidv4(),
                address: '上海市浦东新区陆家嘴环路1000号',
                inspection_type: 'routine',
                phone: '',
                email: '',
                scheduled_at: null,
                status: '需约时间'
            },
            {
                id: uuidv4(),
                address: '广州市天河区珠江新城花城大道123号',
                inspection_type: 'move-out',
                phone: '13611122233',
                email: '',
                scheduled_at: new Date('2024-01-17T09:00:00.000Z'),
                status: '检查完毕'
            },
            {
                id: uuidv4(),
                address: '深圳市南山区科技园中区',
                inspection_type: 'routine',
                phone: '',
                email: 'example4@email.com',
                scheduled_at: null,
                status: '需约时间'
            }
        ];

        await InspectionTask.insertMany(sampleTasks);

        return {
            success: true,
            message: `成功创建 ${sampleTasks.length} 条示例数据`
        };
    } catch (error) {
        return {
            success: false,
            error: error
        };
    }
} 