import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.DJANGO_API_URL || 'https://world-fastest-punch.onrender.com';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('=== 管理者再判定プロキシAPI開始 ===');
    console.log('Submission ID:', params.id);
    
    // フロントから来たBodyをそのまま転送
    const body = await req.json().catch(() => ({}));
    console.log('リクエストボディ:', body);

    // フロントからAuthorizationヘッダをそのまま受け取り、Djangoへ転送
    const auth = req.headers.get("authorization") || "";
    console.log('Authorization ヘッダ:', auth);

    if (!auth) {
      console.log('認証エラー: Authorizationヘッダなし');
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // Django APIにプロキシ
    const djangoUrl = `${BACKEND}/api/submissions/${params.id}/judge/`;
    console.log('Django API URL:', djangoUrl);

    const res = await fetch(djangoUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify(body),
    });

    console.log('Django API レスポンスステータス:', res.status);
    console.log('Django API レスポンスヘッダー:', Object.fromEntries(res.headers.entries()));

    const data = await res.text();
    console.log('Django API レスポンスデータ:', data);

    if (!res.ok) {
      console.log('Django API エラー:', data);
      return NextResponse.json({ ok: false, error: data }, { status: res.status });
    }

    return NextResponse.json(JSON.parse(data || "{}"));

  } catch (error) {
    console.error('プロキシエラー:', error);
    return NextResponse.json(
      { error: '再判定に失敗しました' },
      { status: 500 }
    );
  }
}
