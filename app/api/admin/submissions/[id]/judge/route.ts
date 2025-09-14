import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const judgmentSchema = z.object({
  speed: z.number().min(0).max(1000),
  comment: z.string().optional(),
  status: z.enum(['APPROVED', 'REJECTED'])
})

// POST /api/admin/submissions/[id]/judge - 投稿を判定
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 実際の実装では管理者権限をチェック
    // const isAdmin = await checkAdminRole(session.user.id)
    // if (!isAdmin) {
    //   return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    // }

    const body = await request.json()
    const { speed, comment, status } = judgmentSchema.parse(body)

    const submission = await prisma.submission.findUnique({
      where: { id: params.id }
    })

    if (!submission) {
      return NextResponse.json({ error: '投稿が見つかりません' }, { status: 404 })
    }

    // 投稿を更新
    const updatedSubmission = await prisma.submission.update({
      where: { id: params.id },
      data: {
        speed,
        comment,
        status,
        updatedAt: new Date()
      }
    })

    // 承認された場合、ランキングカテゴリを決定
    if (status === 'APPROVED') {
      let category: string
      if (speed >= 100) category = 'VERY_FAST'
      else if (speed >= 80) category = 'QUITE_FAST'
      else if (speed >= 60) category = 'MODERATE'
      else if (speed >= 40) category = 'SLOW'
      else category = 'VERY_SLOW'

      // 現在の週のランキングを更新
      const now = new Date()
      const week = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
      const year = now.getFullYear()

      // 既存のランキングエントリを削除
      await prisma.ranking.deleteMany({
        where: {
          submissionId: params.id
        }
      })

      // 新しいランキングエントリを作成
      await prisma.ranking.create({
        data: {
          submissionId: params.id,
          category: category as any,
          position: 0, // 実際の実装では適切な位置を計算
          week,
          year
        }
      })
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission
    })

  } catch (error) {
    console.error('判定エラー:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが無効です', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '判定に失敗しました' },
      { status: 500 }
    )
  }
}



