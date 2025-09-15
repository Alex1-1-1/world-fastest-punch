export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server'

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'https://world-fastest-punch.onrender.com'

// POST /api/submissions - 画像アップロード
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const response = await fetch(`${DJANGO_API_URL}/api/submissions/`, {
      method: 'POST',
      body: formData as any,
    })
    
    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('投稿エラー:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '投稿に失敗しました' },
      { status: 500 }
    )
  }
}

// GET /api/submissions - ギャラリー一覧
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')

    // Django APIから投稿一覧を取得
    const params = new URLSearchParams()
    if (page) params.append('page', page)
    if (limit) params.append('limit', limit)

    const response = await fetch(`${DJANGO_API_URL}/api/submissions/?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json(
        { error: 'upstream', status: response.status, body: body.slice(0, 500) },
        { status: 500 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('ギャラリー取得エラー:', error)
    return NextResponse.json(
      { error: 'ギャラリーの取得に失敗しました' },
      { status: 500 }
    )
  }
}