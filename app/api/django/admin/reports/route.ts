import { NextRequest, NextResponse } from 'next/server';

const DJANGO_API_URL = 'http://localhost:8000/api';

export async function GET() {
  try {
    const response = await fetch(`${DJANGO_API_URL}/admin/reports/`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Django API error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin reports' }, { status: 500 });
  }
}



