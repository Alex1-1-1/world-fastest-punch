import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/submissions/[id] - 詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id: params.id
      },
      select: {
        id: true,
        imageUrl: true,
        watermarkedUrl: true,
        speed: true,
        comment: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            image: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    // 承認済みの場合のみ透かし入り画像を返す
    const imageUrl = submission.status === 'APPROVED' 
      ? submission.watermarkedUrl || submission.imageUrl
      : submission.imageUrl

    return NextResponse.json({
      ...submission,
      imageUrl
    })

  } catch (error) {
    console.error('詳細取得エラー:', error)
    return NextResponse.json(
      { error: '詳細の取得に失敗しました' },
      { status: 500 }
    )
  }
}



