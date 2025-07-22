import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/house-inspection';

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

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
        if (cached.conn) {
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

            mongoose.set('strictQuery', true);

            cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
                return mongoose;
            });
        }

        try {
            cached.conn = await cached.promise;
        } catch (e) {
            cached.promise = null;
            throw e;
        }

        console.log('MongoDB connected successfully');
        return cached.conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
}); 