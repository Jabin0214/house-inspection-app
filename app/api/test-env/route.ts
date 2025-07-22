import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        EMAIL_USER_EXISTS: !!process.env.EMAIL_USER,
        EMAIL_PASSWORD_EXISTS: !!process.env.EMAIL_PASSWORD,
        EMAIL_USER_LENGTH: process.env.EMAIL_USER?.length || 0,
        EMAIL_PASSWORD_LENGTH: process.env.EMAIL_PASSWORD?.length || 0,
    });
} 