import { NextRequest, NextResponse } from 'next/server'

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'https://world-fastest-punch.onrender.com'

// GET /api/submissions/[id] - 詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Django APIから投稿詳細を取得
    const response = await fetch(`${DJANGO_API_URL}/api/submissions/${params.id}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
      }
      throw new Error(`Django API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('詳細取得エラー:', error)
    return NextResponse.json(
      { error: '詳細の取得に失敗しました' },
      { status: 500 }
    )
  }
}



