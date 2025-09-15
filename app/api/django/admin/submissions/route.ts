import { NextRequest, NextResponse } from 'next/server';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'https://world-fastest-punch-backend.onrender.com';

export async function GET() {
  try {
    const response = await fetch(`${DJANGO_API_URL}/admin/submissions/`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Django API error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin submissions' }, { status: 500 });
  }
}



