import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/reports - 管理者用通報一覧
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const whereClause: any = {}
    if (status) {
      whereClause.status = status
    }

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        submission: {
          select: {
            id: true,
            imageUrl: true,
            thumbnailUrl: true,
            speed: true,
            comment: true,
            status: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        reporter: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    const total = await prisma.report.count({
      where: whereClause
    })

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('管理者通報取得エラー:', error)
    return NextResponse.json(
      { error: '通報の取得に失敗しました' },
      { status: 500 }
    )
  }
}



