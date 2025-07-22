import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/house-inspection';

if (!MONGODB_URI) {
    console.error('环境变量错误: MONGODB_URI 未定义');
    throw new Error('请在 .env.local 文件中定义 MONGODB_URI 环境变量');
}

// 打印脱敏的连接字符串用于调试
console.log('MongoDB 连接字符串格式检查:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

export async function dbConnect() {
    try {
        console.log('开始连接数据库...');

        if (cached.conn) {
            console.log('使用已缓存的数据库连接');
            return cached.conn;
        }

        if (!cached.promise) {
            const opts = {
                bufferCommands: false,
                maxPoolSize: 10,
                minPoolSize: 5,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            };

            console.log('MongoDB 连接选项:', JSON.stringify(opts, null, 2));
            mongoose.set('strictQuery', true);

            cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
                console.log('MongoDB 连接成功');
                return mongoose;
            });
        }

        try {
            console.log('等待数据库连接...');
            cached.conn = await cached.promise;
        } catch (e) {
            cached.promise = null;
            console.error('MongoDB 连接失败，详细错误:', {
                name: e instanceof Error ? e.name : 'Unknown',
                message: e instanceof Error ? e.message : String(e),
                stack: e instanceof Error ? e.stack : 'No stack trace'
            });
            throw e;
        }

        return cached.conn;
    } catch (error) {
        console.error('MongoDB 连接过程中发生错误:', {
            error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            env: {
                nodeEnv: process.env.NODE_ENV,
                hasMongoUri: !!process.env.MONGODB_URI,
                mongoUriLength: process.env.MONGODB_URI?.length
            }
        });
        throw error;
    }
}

// 监听所有 MongoDB 连接事件
mongoose.connection.on('error', (err) => {
    console.error('MongoDB 连接错误:', {
        error: err.message,
        stack: err.stack,
        code: err.code,
        name: err.name
    });
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB 连接断开');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB 重新连接成功');
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB 连接已建立');
});

mongoose.connection.on('reconnectFailed', () => {
    console.error('MongoDB 重连失败');
});

// 监听数据库操作错误
mongoose.connection.on('error', (error) => {
    console.error('MongoDB 操作错误:', {
        message: error.message,
        code: error.code,
        stack: error.stack
    });
}); 