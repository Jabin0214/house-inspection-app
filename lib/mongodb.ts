import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('请在 .env.local 中设置 MONGODB_URI 环境变量');
}

// 清理URI中可能的换行符和额外空格
const cleanedURI = MONGODB_URI.replace(/\s+/g, '').replace(/\n/g, '');

// 全局连接缓存，避免重复连接
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

// MongoDB连接函数
export async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(cleanedURI, opts);
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

// 检查连接状态的工具函数
export function isConnected() {
    return mongoose.connection.readyState === 1;
}

// 全局类型声明
declare global {
    var mongoose: any;
} 