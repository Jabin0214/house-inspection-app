import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    throw new Error('请在环境变量中设置 MONGODB_URI');
}

let cached = global as any;
if (!cached.mongoose) {
    cached.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.mongoose.conn) {
        return cached.mongoose.conn;
    }

    if (!cached.mongoose.promise) {
        const opts = {
            bufferCommands: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4,
            maxPoolSize: 10,
            minPoolSize: 5,
            keepAlive: true,
            keepAliveInitialDelay: 300000
        };

        cached.mongoose.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log('MongoDB 连接成功');
            return mongoose;
        });
    }

    try {
        cached.mongoose.conn = await cached.mongoose.promise;
    } catch (e) {
        cached.mongoose.promise = null;
        throw e;
    }

    return cached.mongoose.conn;
}

// 监听连接错误
mongoose.connection.on('error', (err) => {
    console.error('MongoDB 连接错误:', err);
});

// 监听连接断开
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB 连接断开，尝试重新连接...');
    cached.mongoose.conn = null;
    cached.mongoose.promise = null;
});

// 监听连接重新连接
mongoose.connection.on('reconnected', () => {
    console.log('MongoDB 重新连接成功');
});

export default dbConnect; 