export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'https://world-fastest-punch.onrender.com';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'weekly';
    
    const response = await fetch(`${DJANGO_API_URL}/ranking/?type=${type}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json(
        { error: 'upstream', status: response.status, body: body.slice(0, 500) },
        { status: 500 }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Django API error:', error);
    return NextResponse.json({ error: 'Failed to fetch ranking' }, { status: 500 });
  }
}



