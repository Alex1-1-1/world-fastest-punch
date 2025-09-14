import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.DJANGO_API_URL || 'https://world-fastest-punch-backend.onrender.com';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    console.log('JWTログイン開始:', { username });
    
    const res = await fetch(`${BACKEND}/api/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await res.json();
    console.log('JWTログインレスポンス:', { status: res.status, data });
    
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    // JWTトークンを返す
    return NextResponse.json({ 
      access: data.access, 
      refresh: data.refresh 
    });
  } catch (error) {
    console.error('JWTログインエラー:', error);
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    );
  }
}


