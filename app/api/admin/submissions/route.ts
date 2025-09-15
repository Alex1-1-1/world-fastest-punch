export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'https://world-fastest-punch.onrender.com'

// GET /api/admin/submissions - 管理者用投稿一覧
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // Django APIから投稿一覧を取得
    const response = await fetch(`${DJANGO_API_URL}/api/admin/submissions/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${session.accessToken || ''}`,
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
    console.error('管理者投稿取得エラー:', error)
    return NextResponse.json(
      { error: '投稿の取得に失敗しました' },
      cache: 'no-store',
      { status: 500 }
    )
  }
}



