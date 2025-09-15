import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/admin/submissions/[id]/judge - 投稿を判定（Django APIにプロキシ）
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== 管理者判定API開始 ===');
    console.log('Submission ID:', params.id);
    
    const session = await getServerSession(authOptions)
    console.log('セッション情報:', session);
    
    if (!session?.user?.id) {
      console.log('認証エラー: セッションなし');
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限をチェック
    const userRole = (session.user as any)?.role;
    console.log('ユーザーロール:', userRole);
    
    if (userRole !== 'ADMIN') {
      console.log('権限エラー: 管理者権限なし');
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    const body = await request.json()
    console.log('リクエストボディ:', body);
    const { speed, comment, status } = body

    // まずDjango APIにログインしてセッションを確立
    console.log('Django APIにログイン中...');
    const loginResponse = await fetch(`${process.env.DJANGO_API_URL || 'https://world-fastest-punch-backend.onrender.com'}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: session.user.email,
        password: process.env.ADMIN_PASSWORD || 'admin123', // 管理者のパスワード
      }),
    });

    if (!loginResponse.ok) {
      console.log('Django APIログイン失敗:', loginResponse.status);
      return NextResponse.json(
        { error: 'Django APIへのログインに失敗しました' },
        { status: 500 }
      )
    }

    const loginData = await loginResponse.json();
    console.log('Django APIログイン成功:', loginData);

    // セッションクッキーを取得
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('セッションクッキー:', setCookieHeader);

    const djangoUrl = `${process.env.DJANGO_API_URL || 'https://world-fastest-punch-backend.onrender.com'}/api/submissions/${params.id}/judge/`;
    const djangoBody = {
      speed_kmh: speed,
      metaphor_comment: comment,
      judgment: status,
      judge_name: '管理者',
    };
    
    console.log('Django API URL:', djangoUrl);
    console.log('Django API Body:', djangoBody);

    // Django APIにプロキシ（セッションクッキー付き）
    const djangoResponse = await fetch(djangoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(setCookieHeader && { 'Cookie': setCookieHeader }),
      },
      credentials: 'include', // クッキーを送信
      body: JSON.stringify(djangoBody),
    })

    console.log('Django API レスポンスステータス:', djangoResponse.status);
    console.log('Django API レスポンスヘッダー:', Object.fromEntries(djangoResponse.headers.entries()));

    if (!djangoResponse.ok) {
      const errorData = await djangoResponse.json()
      console.log('Django API エラーデータ:', errorData);
      return NextResponse.json(
        { error: errorData.error || '判定に失敗しました' },
        { status: djangoResponse.status }
      )
    }

    const result = await djangoResponse.json()
    console.log('Django API 成功レスポンス:', result);
    
    return NextResponse.json({
      success: true,
      result: result
    })

  } catch (error) {
    console.error('判定エラー:', error)
    return NextResponse.json(
      { error: '判定に失敗しました' },
      { status: 500 }
    )
  }
}



