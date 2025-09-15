export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server'

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'https://world-fastest-punch.onrender.com'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'speed'
    const week = searchParams.get('week')
    const year = searchParams.get('year')

    // Django APIからランキングを取得
    const params = new URLSearchParams()
    params.append('category', category)
    if (week) params.append('week', week)
    if (year) params.append('year', year)

    const response = await fetch(`${DJANGO_API_URL}/api/ranking/?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      const body = await response.text()
      return NextResponse.json(
        { error: 'upstream', status: response.status, body: body.slice(0, 500) },
        { status: 500 }
      )
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