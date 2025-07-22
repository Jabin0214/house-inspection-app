import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/database';
import Property from '@/lib/models/Property';

export async function GET() {
    try {
        await dbConnect();
        const properties = await Property.find().distinct('address');
        return NextResponse.json({ success: true, data: properties });
    } catch (error) {
        console.error('获取地址列表失败:', error);
        return NextResponse.json(
            { success: false, error: '获取地址列表失败' },
            { status: 500 }
        );
    }
} 