import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/ranking - ランキング取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as string
    const week = parseInt(searchParams.get('week') || new Date().getWeek().toString())
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    const whereClause: any = {
      status: 'APPROVED',
      speed: { not: null }
    }

    // カテゴリ別の速度範囲を設定
    if (category) {
      const speedRanges = {
        'VERY_FAST': { gte: 100 },
        'QUITE_FAST': { gte: 80, lt: 100 },
        'MODERATE': { gte: 60, lt: 80 },
        'SLOW': { gte: 40, lt: 60 },
        'VERY_SLOW': { gte: 0, lt: 40 }
      }
      
      if (speedRanges[category as keyof typeof speedRanges]) {
        whereClause.speed = speedRanges[category as keyof typeof speedRanges]
      }
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      select: {
        id: true,
        thumbnailUrl: true,
        speed: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        speed: 'desc'
      },
      take: 50
    })

    // 週次ランキングスナップショットを取得
    const weeklyRankings = await prisma.ranking.findMany({
      where: {
        week,
        year,
        ...(category && { category: category as any })
      },
      include: {
        submission: {
          select: {
            id: true,
            thumbnailUrl: true,
            speed: true,
            comment: true,
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    })

    return NextResponse.json({
      currentRankings: submissions,
      weeklyRankings: weeklyRankings.map(r => ({
        position: r.position,
        ...r.submission
      })),
      category,
      week,
      year
    })

  } catch (error) {
    console.error('ランキング取得エラー:', error)
    return NextResponse.json(
      { error: 'ランキングの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 週番号を取得するヘルパー関数
declare global {
  interface Date {
    getWeek(): number
  }
}

Date.prototype.getWeek = function() {
  const onejan = new Date(this.getFullYear(), 0, 1)
  return Math.ceil((((this.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7)
}



