import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import { PropertyModel } from '@/lib/models/Property';

export async function GET() {
    try {
        await dbConnect();
        // 获取所有唯一的Property值
        const properties = await PropertyModel.find().distinct('Property');
        return NextResponse.json({
            success: true,
            data: properties
        });
    } catch (error) {
        console.error('获取物业列表失败:', error);
        return NextResponse.json({
            success: false,
            error: '获取物业列表失败'
        }, { status: 500 });
    }
} 