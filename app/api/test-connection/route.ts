import { NextResponse } from 'next/server';
import { testConnection, createSampleData } from '../../../lib/test-connection';

export async function GET() {
    try {
        const result = await testConnection();
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({
            connected: false,
            collectionExists: false,
            error: error.message
        });
    }
}

export async function POST() {
    try {
        const result = await createSampleData();
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        });
    }
} 