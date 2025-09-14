import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reportUpdateSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'])
})

// PATCH /api/admin/reports/[id] - 通報のステータスを更新
export async function PATCH(
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
    const { status } = reportUpdateSchema.parse(body)

    const report = await prisma.report.findUnique({
      where: { id: params.id }
    })

    if (!report) {
      return NextResponse.json({ error: '通報が見つかりません' }, { status: 404 })
    }

    const updatedReport = await prisma.report.update({
      where: { id: params.id },
      data: {
        status,
        updatedAt: new Date()
      }
    })

    // 通報が解決された場合、関連する投稿を削除する場合がある
    if (status === 'RESOLVED') {
      // 実際の実装では、通報の内容に応じて投稿を削除するかどうかを決定
      // ここでは例として、複数の通報がある場合のみ削除
      const reportCount = await prisma.report.count({
        where: {
          submissionId: report.submissionId,
          status: 'RESOLVED'
        }
      })

      if (reportCount >= 3) { // 3回以上通報された場合
        await prisma.submission.update({
          where: { id: report.submissionId },
          data: { status: 'REJECTED' }
        })
      }
    }

    return NextResponse.json({
      success: true,
      report: updatedReport
    })

  } catch (error) {
    console.error('通報更新エラー:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが無効です', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '通報の更新に失敗しました' },
      { status: 500 }
    )
  }
}



