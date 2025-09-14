import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000'

// GET /api/admin/reports - 管理者用通報一覧
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // Django APIから通報一覧を取得
    const response = await fetch(`${DJANGO_API_URL}/api/admin/reports/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken || ''}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Django API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('管理者通報取得エラー:', error)
    return NextResponse.json(
      { error: '通報の取得に失敗しました' },
      { status: 500 }
    )
  }
}



