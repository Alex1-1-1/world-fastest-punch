import { NextRequest, NextResponse } from 'next/server'

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000'

// GET /api/ranking - ランキング取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const week = searchParams.get('week')
    const year = searchParams.get('year')

    // Django APIからランキングを取得
    const params = new URLSearchParams()
    if (category) params.append('category', category)
    if (week) params.append('week', week)
    if (year) params.append('year', year)

    const response = await fetch(`${DJANGO_API_URL}/api/ranking/?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('ランキング取得エラー:', error)
    return NextResponse.json(
      { error: 'ランキングの取得に失敗しました' },
      { status: 500 }
    )
  }
}



