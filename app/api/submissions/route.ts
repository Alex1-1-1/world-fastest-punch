import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadImage, validateImage } from '@/lib/image-utils'
import { z } from 'zod'

const submissionSchema = z.object({
  image: z.string().min(1, '画像が必要です'),
  userId: z.string().min(1, 'ユーザーIDが必要です')
})

// POST /api/submissions - 画像アップロード
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json({ error: '画像ファイルが必要です' }, { status: 400 })
    }

    // ファイルをバッファに変換
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 画像検証
    validateImage(buffer, file.name)

    // 画像アップロード
    const uploadResult = await uploadImage(buffer, file.name, userId)

    // データベースに保存
    const submission = await prisma.submission.create({
      data: {
        userId,
        imageUrl: uploadResult.imageUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
        watermarkedUrl: uploadResult.watermarkedUrl,
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      id: submission.id,
      imageUrl: uploadResult.imageUrl,
      thumbnailUrl: uploadResult.thumbnailUrl,
      status: submission.status,
      createdAt: submission.createdAt
    })

  } catch (error) {
    console.error('投稿エラー:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '投稿に失敗しました' },
      { status: 500 }
    )
  }
}

// GET /api/submissions - ギャラリー一覧
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const submissions = await prisma.submission.findMany({
      where: {
        status: 'APPROVED'
      },
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
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    const total = await prisma.submission.count({
      where: {
        status: 'APPROVED'
      }
    })

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('ギャラリー取得エラー:', error)
    return NextResponse.json(
      { error: 'ギャラリーの取得に失敗しました' },
      { status: 500 }
    )
  }
}



