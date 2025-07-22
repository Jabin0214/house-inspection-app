import { NextResponse } from 'next/server';
import { getAllProperties } from '../../../lib/database';

export async function GET() {
    try {
        const addresses = await getAllProperties();
        return NextResponse.json({ success: true, data: addresses });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
} 