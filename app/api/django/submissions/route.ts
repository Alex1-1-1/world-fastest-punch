import { NextRequest, NextResponse } from 'next/server';

const DJANGO_API_URL = 'http://localhost:8000/api';

export async function GET() {
  try {
    const response = await fetch(`${DJANGO_API_URL}/submissions/`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Django API error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const response = await fetch(`${DJANGO_API_URL}/submissions/`, {
      method: 'POST',
      body: formData as any,
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Django API error:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}



